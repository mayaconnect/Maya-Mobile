/**
 * Maya Connect V2 — Auth API Module
 * All /api/v1/auth/* endpoints
 */
import apiClient from './client';
import type {
  LoginDto,
  RegisterDto,
  GoogleSignInDto,
  AppleSignInDto,
  RefreshDto,
  UpdateProfileDto,
  ResetRequestDto,
  RequestResetCodeDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponse,
  UserProfile,
} from '../types';

const BASE = '/api/v1/auth';

export const authApi = {
  /** POST /api/v1/auth/login */
  login: (dto: LoginDto) =>
    apiClient.post<AuthResponse>(`${BASE}/login`, dto),

  /** POST /api/v1/auth/register */
  register: (dto: RegisterDto) =>
    apiClient.post<AuthResponse>(`${BASE}/register`, dto),

  /** POST /api/v1/auth/google */
  googleSignIn: (dto: GoogleSignInDto) =>
    apiClient.post<AuthResponse>(`${BASE}/google`, dto),

  /** POST /api/v1/auth/apple */
  appleSignIn: (dto: AppleSignInDto) =>
    apiClient.post<AuthResponse>(`${BASE}/apple`, dto),

  /** POST /api/v1/auth/refresh */
  refresh: (dto: RefreshDto) =>
    apiClient.post<AuthResponse>(`${BASE}/refresh`, dto),

  /** POST /api/v1/auth/logout */
  logout: (dto: RefreshDto) =>
    apiClient.post(`${BASE}/logout`, dto),

  /** GET /api/v1/auth/me */
  getProfile: () =>
    apiClient.get<UserProfile>(`${BASE}/me`),

  /** PUT /api/v1/auth/me */
  updateProfile: (dto: UpdateProfileDto) =>
    apiClient.put(`${BASE}/me`, dto),

  /** POST /api/v1/auth/upload-avatar (multipart) */
  uploadAvatar: (formData: FormData) =>
    apiClient.post(`${BASE}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data: any) => data,
    }),

  /** DELETE /api/v1/auth/remove-avatar */
  removeAvatar: () =>
    apiClient.delete(`${BASE}/remove-avatar`),

  // ── Password Reset Flow ──

  /** POST /api/v1/auth/request-password-reset */
  requestPasswordReset: (dto: ResetRequestDto) =>
    apiClient.post(`${BASE}/request-password-reset`, dto),

  /** POST /api/v1/auth/request-password-reset-code */
  requestPasswordResetCode: (dto: RequestResetCodeDto) =>
    apiClient.post(`${BASE}/request-password-reset-code`, dto),

  /** POST /api/v1/auth/verify-password-reset-code */
  verifyPasswordResetCode: (dto: VerifyResetCodeDto) =>
    apiClient.post(`${BASE}/verify-password-reset-code`, dto),

  /** POST /api/v1/auth/reset-password */
  resetPassword: (dto: ResetPasswordDto) =>
    apiClient.post(`${BASE}/reset-password`, dto),

  /** POST /api/v1/auth/change-password (authenticated) */
  changePassword: (dto: ChangePasswordDto) =>
    apiClient.post(`${BASE}/change-password`, dto),
};
