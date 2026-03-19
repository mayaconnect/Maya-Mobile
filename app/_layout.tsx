/**
 * Maya Connect V2 — Root Layout
 *
 * Wraps the entire app in:
 *  • SafeAreaProvider
 *  • QueryClientProvider (react-query)
 *  • Auth hydration gate
 *  • Splash screen management
 */
import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuthStore } from '../src/stores/auth.store';
import { authApi } from '../src/api/auth.api';
import { usePushNotifications } from '../src/hooks/use-push-notifications';
import { colors } from '../src/theme/colors';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 30 * 60 * 1000, // 30 min — was cacheTime in v4
    },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  // Register push notifications — auto-registers token when authenticated
  usePushNotifications();

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        'Inter-Light': Inter_300Light,
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
      });
      setFontsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrating && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isHydrating, fontsLoaded]);

  // ── StatusApp online / offline ──
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const updateStatus = (statusApp: string) => {
      const token = useAuthStore.getState().accessToken;
      if (!token) return;
      authApi.updateProfile({ statusApp }).catch(() => {});
    };

    // Mark online once hydrated and authenticated
    if (!isHydrating) {
      updateStatus('online');
    }

    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        updateStatus('online');
      } else if (next.match(/inactive|background/)) {
        updateStatus('offline');
      }
      appStateRef.current = next;
    });

    return () => sub.remove();
  }, [isHydrating]);

  if (isHydrating || !fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" backgroundColor={colors.neutral[0]} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="onboarding"
              options={{ animation: 'fade' }}
            />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(client)" />
            <Stack.Screen name="(partner)" />
            <Stack.Screen name="(storeoperator)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
