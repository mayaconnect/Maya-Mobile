import { API_BASE_URL } from '../auth.service';

export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0,
  baseUrlOverride?: string,
): Promise<T> => {
  const baseUrl = baseUrlOverride ?? API_BASE_URL;
  const url = `${baseUrl}${endpoint}`;

  // S'assurer que les headers sont correctement passés
  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
    },
  };

  console.log('🌐 [API Call] Requête:', {
    url,
    method: finalOptions.method || 'GET',
    hasHeaders: !!finalOptions.headers,
    headersKeys: finalOptions.headers ? Object.keys(finalOptions.headers as Record<string, string>) : [],
  });

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

