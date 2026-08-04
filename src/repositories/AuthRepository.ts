export { authService } from '@/services/auth';
export { authRepository } from '../../backend/repositories/AuthRepository';
export type {
  OAuthProvider,
  AuthChangeEvent,
  AuthStateCallback,
} from '../../backend/repositories/AuthRepository';
export type { UserProfile, AuthCredentials, SignUpData, AuthMethod, AuthState } from '@/services/auth/types';
