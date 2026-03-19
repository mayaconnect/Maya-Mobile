/**
 * Maya Connect V2 — Root Index
 *
 * Entry gate: redirects to onboarding, auth, or main tabs
 * depending on session state.
 */
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { LoadingSpinner } from '../src/components/ui';

export default function RootIndex() {
  const router = useRouter();
  const { isAuthenticated, hasOnboarded, role } = useAuthStore();
  const hasNavigated = useRef(false);
  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    // When auth state changes, allow re-navigation
    if (prevAuth.current !== isAuthenticated) {
      hasNavigated.current = false;
      prevAuth.current = isAuthenticated;
    }

    // Prevent double navigation (e.g., during logout state transition)
    if (hasNavigated.current) return;

    if (!hasOnboarded) {
      hasNavigated.current = true;
      router.replace('/onboarding');
      return;
    }

    if (!isAuthenticated) {
      hasNavigated.current = true;
      router.replace('/auth/login');
      return;
    }

    // Route based on role
    hasNavigated.current = true;
    if (role === 'partner') {
      router.replace('/(partner)/dashboard');
    } else if (role === 'storeOperator') {
      router.replace('/(storeoperator)/dashboard');
    } else {
      router.replace('/(client)/home');
    }
  }, [isAuthenticated, hasOnboarded, role, router]);

  return <LoadingSpinner fullScreen message="Chargement…" />;
}
