/**
 * Export centralisé des modules d'authentification
 */

export * from './auth.types';
export * from './auth.tokens';
export * from './auth.config';
export * from './auth.password-reset';
export * from './auth.oauth';
export * from './auth.login';
export * from './auth.profile';

// Réexporter depuis auth.service.ts pour compatibilité
export { AuthService, API_BASE_URL } from '../auth.service';
export type {
  Address,
  RegisterRequest,
  User,
  PublicUser,
  LoginRequest,
  ApiResponse,
} from '../auth.service';

