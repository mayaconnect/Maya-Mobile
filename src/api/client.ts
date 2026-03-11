/**
 * Maya Connect V2 — Axios API Client
 * Central HTTP client with:
 *  • Bearer token injection
 *  • Auto-refresh on 401 with request queue
 *  • Retry with exponential backoff (skips 401/403/404)
 *  • Structured error extraction (RFC 7807 ProblemDetails)
 */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../constants/config';
import { useAuthStore } from '../stores/auth.store';

// ── Types ──
interface RetryConfig {
  _retry?: boolean;
  _retryCount?: number;
}

type RetryableRequest = InternalAxiosRequestConfig & RetryConfig;

// ── Error Extraction ──
/**
 * Extracts a human-readable error message from API responses.
 * Supports RFC 7807 ProblemDetails + ASP.NET ModelState + plain text.
 */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      // RFC 7807 ProblemDetails
      if (typeof data === 'object') {
        if (data.detail) return String(data.detail);
        if (data.title) return String(data.title);
        if (data.message) return String(data.message);
        // ASP.NET validation errors
        if (data.errors && typeof data.errors === 'object') {
          const messages = Object.values(data.errors).flat();
          if (messages.length > 0) return messages.join('. ');
        }
      }
      if (typeof data === 'string' && data.length < 200) return data;
    }
    // Network / timeout
    if (error.code === 'ECONNABORTED') return 'La requête a expiré. Vérifiez votre connexion.';
    if (error.code === 'ERR_NETWORK') return 'Erreur réseau. Vérifiez votre connexion internet.';
    if (error.response?.status === 429) return 'Trop de requêtes. Veuillez réessayer dans un instant.';
    if (error.response?.status === 500) return 'Erreur serveur. Veuillez réessayer plus tard.';
    if (error.response?.status === 503) return 'Service temporairement indisponible.';
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue.';
}

// ── Helper: non-retryable status codes ──
const NON_RETRYABLE = new Set([400, 401, 403, 404, 409, 422]);

function shouldRetry(error: AxiosError): boolean {
  if (!error.response) return true; // network error → retry
  return !NON_RETRYABLE.has(error.response.status);
}

// ── Create the shared Axios instance ──
const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor: inject Bearer token + request logging ──
apiClient.interceptors.request.use(
  (req: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      req.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (__DEV__) {
      console.log(`[API] ${req.method?.toUpperCase()} ${req.url}`);
    }
    return req;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh on 401 + retry with backoff ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest;
    if (!originalRequest) return Promise.reject(error);

    // ── 401 → Attempt token refresh ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken, setAccessToken } = useAuthStore.getState();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${config.api.baseUrl}/api/v1/auth/refresh`,
          { refreshToken },
        );

        await setAccessToken(data.accessToken);
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Retry with exponential backoff ──
    const retryCount = originalRequest._retryCount ?? 0;
    if (retryCount < config.api.retryAttempts && shouldRetry(error)) {
      originalRequest._retryCount = retryCount + 1;
      const delay = config.api.retryDelay * Math.pow(2, retryCount);
      if (__DEV__) {
        console.log(`[API] Retry ${originalRequest._retryCount}/${config.api.retryAttempts} in ${delay}ms`);
      }
      await sleep(delay);
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
