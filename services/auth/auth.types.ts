/**
 * Types et interfaces pour l'authentification
 */

// Interface pour l'adresse selon l'API backend
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Interface pour l'inscription selon l'API backend
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO 8601 format
  address: Address;
  avatarBase64?: string;
  role?: 'partners' | 'client';
}

// Interface utilisateur complète (local)
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  address: Address;
  avatarBase64?: string;
  createdAt: string;
}

// Interface utilisateur publique (sans mot de passe)
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  address: Address;
  avatarBase64?: string;
  createdAt: string;
}

// Interface pour la requête de login
export interface LoginRequest {
  email: string;
  password: string;
  role?: 'partners' | 'client';
}

// Interface de réponse de l'API
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Interface pour les tokens
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  userId: string;
}

