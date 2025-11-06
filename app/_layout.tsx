import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LoadingScreen } from '@/components/common/loading-screen';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';


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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}