import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LoadingScreen } from '@/components/common/loading-screen';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/contexts/app-context';
import { offlineSync } from '@/utils/offline-sync';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';


function RootLayoutNav() {
  const { user, loading } = useAuth();

  // Afficher l'écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return <LoadingScreen message="Vérification de votre connexion..." />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/onboarding-2" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/onboarding-3" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/onboarding-4" options={{ headerShown: false }} />
      <Stack.Screen name="connexion/login" options={{ headerShown: false }} />
      <Stack.Screen name="connexion/signup" options={{ headerShown: false }} />
      <Stack.Screen name="connexion/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useFonts(Ionicons.font);

  // Initialiser la synchronisation offline au démarrage
  useEffect(() => {
    offlineSync.initialize().catch((error) => {
      console.error('Erreur lors de l\'initialisation de la synchronisation offline:', error);
    });

    // Cleanup au démontage
    return () => {
      offlineSync.cleanup();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProvider>
        <AuthProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}