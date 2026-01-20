/**
 * Types partagés pour toute l'application
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'client' | 'partner' | 'operator' | 'partners';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  address?: Address;
  avatarBase64?: string;
  role?: UserRole;
  isPartner?: boolean;
  isOperator?: boolean;
  createdAt?: string;
  updatedAt?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface PublicUser extends Omit<User, 'password'> {
  // PublicUser est déjà sans password grâce à Omit
}

export interface UserProfile extends User {
  subscription?: {
    id: string;
    planCode: string;
    isActive: boolean;
    startedAt: string;
    expiresAt: string;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  address: Address;
  avatarBase64?: string;
  role?: UserRole;
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  userId: string;
  tokenType?: string;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: TokenData;
}

// ============================================================================
// PARTNER TYPES
// ============================================================================

export interface PartnerPromotion {
  discount: string;
  description: string;
  isActive: boolean;
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  address: string;
  distance: number | null;
  isOpen: boolean;
  closingTime: string | null;
  category: string;
  image: string;
  promotion?: PartnerPromotion | null;
  rating: number;
  latitude?: number;
  longitude?: number;
}

export interface PartnerQueryParams {
  name?: string;
  email?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  category?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface PartnerListResponse extends PaginatedResponse<Partner> {}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface Transaction {
  id: string;
  userId: string;
  partnerId?: string;
  storeId?: string;
  amountGross: number;
  amountNet: number;
  discountPercent: number;
  discountAmount: number;
  personsCount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionQueryParams {
  userId?: string;
  partnerId?: string;
  storeId?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export interface TransactionListResponse extends PaginatedResponse<Transaction> {}

// ============================================================================
// QR CODE TYPES
// ============================================================================

export interface QrTokenData {
  token: string;
  expiresAt: string;
}

export interface QrCodeResponse {
  token: string;
  expiresAt: string;
  imageBase64?: string;
  qrCodeUrl?: string;
}

export interface QrValidationRequest {
  qrToken: string;
  partnerId?: string;
  storeId?: string;
  operatorUserId?: string;
  amountGross: number;
  personsCount: number;
  discountPercent: number;
}

export interface QrValidationResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  discountAmount?: number;
  amountNet?: number;
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface Store {
  id: string;
  name: string;
  partnerId: string;
  address?: Address;
  category?: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  openingHours?: {
    opening?: string;
    closing?: string;
  };
}

export interface StoreQueryParams {
  partnerId?: string;
  name?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface StoreListResponse extends PaginatedResponse<Store> {}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;



