/**
 * Maya Connect V2 — Root Index
 *
 * Entry gate: redirects to onboarding, auth, or main tabs
 * depending on session state.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { LoadingSpinner } from '../src/components/ui';

export default function RootIndex() {
  const router = useRouter();
  const { isAuthenticated, hasOnboarded, role } = useAuthStore();

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace('/onboarding');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    // Route based on role
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
