/**
 * Maya Connect V2 — Auth Types (from api.json schemas)
 */
import type { AddressDto } from './api.types';

/** POST /api/v1/auth/login */
export interface LoginDto {
  email: string;
  password: string;
}

/** POST /api/v1/auth/register */
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string | null;
  birthDate?: string;
  address?: AddressDto;
  phoneNumber?: string | null;
  avatarBase64?: string | null;
  avatarFileName?: string | null;
}

/** POST /api/v1/auth/google */
export interface GoogleSignInDto {
  idToken: string;
}

/** POST /api/v1/auth/apple */
export interface AppleSignInDto {
  idToken?: string | null;
  authorizationCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/** POST /api/v1/auth/refresh */
export interface RefreshDto {
  refreshToken: string;
}

/** PUT /api/v1/auth/me */
export interface UpdateProfileDto {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  statusApp?: string | null;
  address?: AddressDto;
  status?: UserStatus;
}

/** Password reset flow DTOs */
export interface ResetRequestDto {
  email: string;
}

export interface RequestResetCodeDto {
  email: string;
  phoneNumber?: string | null;
  channel?: string | null;
}

export interface VerifyResetCodeDto {
  email: string;
  code: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

/** POST /api/v1/auth/change-password */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/** User status enum (from api.json) */
export enum UserStatus {
  Inactive = 0,
  Active = 1,
  Suspended = 2,
  Deleted = 3,
}

/** Auth response (login/register/oauth) — inferred from old app */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

/**
 * Store assignment returned inside PartnerData from GET /api/v1/auth/me.
 * Only present for Partner / StoreOperator roles.
 */
export interface OperatorStoreInfo {
  id: string;               // StoreId
  name?: string | null;     // Store name
  partnerId?: string | null;
  partner?: {
    id: string;
    legalName: string;
    displayName?: string | null;
    email?: string | null;
  } | null;
  isManager?: boolean;
  isActiveStore?: boolean;
  lastActiveStoreChangedAt?: string | null;
}

/** User profile (from GET /api/v1/auth/me) */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  address?: AddressDto | null;
  status?: string | null;
  statusApp?: string | null;
  /** API returns a single role string (e.g. "Partner", "StoreOperator", "Client", "Admin") */
  role?: string | null;
  /** Legacy / alternative: array of {id, name} objects (kept for backward-compat) */
  roles?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  stripeCustomerId?: string | null;
  /**
   * Only present for Partner / StoreOperator roles.
   * Contains the list of stores the operator is assigned to, with partner info.
   */
  partnerData?: {
    operatorStores: OperatorStoreInfo[];
  } | null;
}

/** Token pair stored locally */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
}

/** Derived role for the mobile app */
export type AppRole = 'client' | 'partner' | 'storeOperator' | 'admin';
