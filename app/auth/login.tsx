/**
 * Maya Connect V2 — Login Screen
 *
 * Features:
 *  • Email + Password form (react-hook-form + zod)
 *  • Google Sign-In button
 *  • Apple Sign-In button (iOS only)
 *  • Forgot password link
 *  • Register link
 *  • Gradient accent background
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api/auth.api';
import { loginSchema, type LoginFormData } from '../../src/utils/validation';
import { colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, hp, isIOS } from '../../src/utils/responsive';
import { MButton, MInput, MDivider } from '../../src/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  /* ---- Email/Password login ---- */
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);

      // 1. Get tokens from login endpoint
      const { data: loginData } = await authApi.login(data);
      const { accessToken, refreshToken, expiresIn } = loginData;

      // 2. Temporarily set token so interceptor injects it for /me call
      useAuthStore.setState({ accessToken });

      // 3. Fetch full profile (includes roles)
      const { data: user } = await authApi.getProfile();

      // 4. Persist complete session
      await setSession(
        { accessToken, refreshToken, expiresAt: Date.now() + (expiresIn ?? 3600) * 1000 },
        user,
      );

      // Mark onboarding done (in case of reinstall with existing account)
      await completeOnboarding();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 5. Navigate based on role
      const role = useAuthStore.getState().role;
      if (role === 'storeOperator') {
        router.replace('/(storeoperator)/dashboard');
      } else if (role === 'partner') {
        router.replace('/(partner)/dashboard');
      } else {
        router.replace('/(client)/home');
      }
    } catch (err: any) {
      // Clear any stale token on failure
      useAuthStore.setState({ accessToken: null });
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        'Identifiants incorrects. Veuillez réessayer.';
      Alert.alert('Erreur de connexion', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Google login ---- */
  const handleGoogleLogin = async () => {
    // TODO: implement expo-auth-session Google PKCE flow
    Alert.alert('Google', 'Connexion Google bientôt disponible.');
  };

  /* ---- Apple login ---- */
  const handleAppleLogin = async () => {
    // TODO: implement expo-apple-authentication
    Alert.alert('Apple', 'Connexion Apple bientôt disponible.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={isIOS ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[6] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brand}>Maya Connect</Text>
          <Text style={styles.tagline}>
            Connectez-vous et commencez à économiser
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Adresse e-mail"
                icon="mail-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                required
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Mot de passe"
                icon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                required
              />
            )}
          />

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Submit */}
          <MButton
            title="Se connecter"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        {/* Social login */}
        <MDivider label="ou continuer avec" />

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={handleGoogleLogin}
          >
            <Ionicons name="logo-google" size={wp(22)} color="#DB4437" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          {isIOS && (
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleAppleLogin}
            >
              <Ionicons name="logo-apple" size={wp(22)} color="#000" />
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerLabel}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.registerLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
  },
  /* Logo */
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoImage: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(20),
    marginBottom: spacing[4],
  },
  brand: {
    ...textStyles.h2,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  tagline: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  /* Form */
  form: {
    marginBottom: spacing[2],
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing[4],
  },
  forgotText: {
    ...textStyles.caption,
    color: colors.orange[500],
    fontFamily: fontFamily.medium,
  },
  submitBtn: {
    marginTop: spacing[2],
  },
  /* Social */
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing[2],
  },
  socialText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[700],
  },
  /* Register */
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  registerLabel: {
    ...textStyles.body,
    color: colors.neutral[500],
  },
  registerLink: {
    ...textStyles.body,
    color: colors.orange[500],
    fontFamily: fontFamily.semiBold,
  },
});
