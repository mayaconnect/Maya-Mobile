export interface LoginCredentials {
  email: string;
  password: string;
  role?: 'client' | 'partners';
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  avatarBase64?: string;
  role?: 'client' | 'partners';
}

export interface ResetPasswordRequest {
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

