/**
 * Maya Connect V2 — Login Screen
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api/auth.api';
import { loginSchema, type LoginFormData } from '../../src/utils/validation';
import { colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { MButton, MInput, MDivider } from '../../src/components/ui';
import {
  checkBiometricAvailability,
  getBiometricType,
  authenticateWithBiometric,
  getBiometricCredentials,
  isBiometricLoginEnabled,
} from '../../src/utils/biometric';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await checkBiometricAvailability();
      const enabled = await isBiometricLoginEnabled();
      if (available && enabled) {
        const type = await getBiometricType();
        setBiometricType(type);
        setBiometricAvailable(true);
      }
    })();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const { data: loginData } = await authApi.login(data);
      const { accessToken, refreshToken, expiresIn } = loginData;
      useAuthStore.setState({ accessToken });
      const { data: user } = await authApi.getProfile();
      await setSession(
        { accessToken, refreshToken, expiresAt: Date.now() + (expiresIn ?? 3600) * 1000 },
        user,
      );
      await completeOnboarding();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const role = useAuthStore.getState().role;
      if (role === 'storeOperator') {
        router.replace('/(storeoperator)/dashboard');
      } else if (role === 'partner') {
        router.replace('/(partner)/dashboard');
      } else {
        router.replace('/(client)/home');
      }
    } catch (err: any) {
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

  const handleBiometricLogin = async () => {
    try {
      setBiometricLoading(true);
      const success = await authenticateWithBiometric(`Se connecter avec ${biometricType}`);
      if (!success) return;

      const credentials = await getBiometricCredentials();
      if (!credentials) {
        Alert.alert('Erreur', 'Identifiants biométriques introuvables. Veuillez vous reconnecter manuellement.');
        setBiometricAvailable(false);
        return;
      }

      const { data: loginData } = await authApi.login(credentials);
      const { accessToken, refreshToken, expiresIn } = loginData;
      useAuthStore.setState({ accessToken });
      const { data: user } = await authApi.getProfile();
      await setSession(
        { accessToken, refreshToken, expiresAt: Date.now() + (expiresIn ?? 3600) * 1000 },
        user,
      );
      await completeOnboarding();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const role = useAuthStore.getState().role;
      if (role === 'storeOperator') {
        router.replace('/(storeoperator)/dashboard');
      } else if (role === 'partner') {
        router.replace('/(partner)/dashboard');
      } else {
        router.replace('/(client)/home');
      }
    } catch (err: any) {
      useAuthStore.setState({ accessToken: null });
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        'Connexion biométrique échouée. Veuillez réessayer.';
      Alert.alert('Erreur', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Google', 'Connexion Google bientôt disponible.');
  };

  const handleAppleLogin = async () => {
    Alert.alert('Apple', 'Connexion Apple bientôt disponible.');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: '#FFFFFF' }]}
      behavior={isIOS ? 'padding' : undefined}
    >
      {/* Logo en haut, fond blanc */}
      <View style={[styles.logoArea, { paddingTop: insets.top + spacing[6] }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.brand}>Maya Connect</Text>
        <Text style={styles.tagline}>Connectez-vous et commencez à économiser</Text>
      </View>

      {/* Bulle sombre en bas */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={[styles.card, { paddingBottom: insets.bottom + spacing[6] }]}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Connexion</Text>

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

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <MButton
            title="Se connecter"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitBtn}
          />

          {biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometricLogin}
              disabled={biometricLoading}
              activeOpacity={0.75}
            >
              <Ionicons
                name={biometricType.includes('Face') ? 'scan-outline' : 'finger-print-outline'}
                size={wp(22)}
                color={colors.orange[400]}
              />
              <Text style={styles.biometricText}>
                {biometricLoading ? 'Vérification...' : `Se connecter avec ${biometricType}`}
              </Text>
            </TouchableOpacity>
          )}

          <MDivider label="ou continuer avec" />

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
              <Ionicons name="logo-google" size={wp(22)} color="#DB4437" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            {isIOS && (
              <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin}>
                <Ionicons name="logo-apple" size={wp(22)} color="#000" />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerLabel}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  logoImage: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(16),
    marginBottom: spacing[3],
  },
  brand: {
    ...textStyles.h3,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  tagline: {
    ...textStyles.caption,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  /* Bulle sombre */
  card: {
    flex: 2,
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: spacing[3],
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing[2],
  },
  forgotText: {
    ...textStyles.caption,
    color: colors.orange[400],
    fontFamily: fontFamily.medium,
  },
  submitBtn: {
    marginTop: spacing[1],
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: `${colors.orange[400]}40`,
    backgroundColor: `${colors.orange[500]}18`,
    gap: spacing[2],
    marginTop: spacing[2],
  },
  biometricText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.orange[400],
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: spacing[2],
  },
  socialText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.85)',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[3],
  },
  registerLabel: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.5)',
  },
  registerLink: {
    ...textStyles.caption,
    color: colors.orange[400],
    fontFamily: fontFamily.semiBold,
  },
});
