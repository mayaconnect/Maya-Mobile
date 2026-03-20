/**
 * Maya Connect V2 — Login Screen
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api/auth.api';
import { loginSchema, type LoginFormData } from '../../src/utils/validation';
import { colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { MButton, MInput, MDivider, MModal } from '../../src/components/ui';
import {
  checkBiometricAvailability,
  getBiometricType,
  authenticateWithBiometric,
  getBiometricCredentials,
  isBiometricLoginEnabled,
} from '../../src/utils/biometric';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '125229396520-enrhsjtp80ehijnf0ru39n1j18ic2vqv.apps.googleusercontent.com';

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);

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
      setErrorModal({ title: 'Erreur de connexion', message: msg });
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
        setErrorModal({ title: 'Erreur', message: 'Identifiants biométriques introuvables. Veuillez vous reconnecter manuellement.' });
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
      setErrorModal({ title: 'Erreur', message: msg });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'com.mayaconnect.app' });
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        usePKCE: false,
      });
      const result = await request.promptAsync(googleDiscovery);
      if (result.type === 'success' && result.params?.id_token) {
        const { data: loginData } = await authApi.googleSignIn({ idToken: result.params.id_token });
        const { accessToken, refreshToken } = loginData;
        useAuthStore.setState({ accessToken });
        const { data: user } = await authApi.getProfile();
        await setSession(
          { accessToken, refreshToken, expiresAt: Date.now() + (loginData.expiresIn ?? 3600) * 1000 },
          user,
        );
        await completeOnboarding();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const role = useAuthStore.getState().role;
        if (role === 'storeOperator') router.replace('/(storeoperator)/dashboard');
        else if (role === 'partner') router.replace('/(partner)/dashboard');
        else router.replace('/(client)/home');
      } else if (result.type !== 'dismiss') {
        setErrorModal({ title: 'Google', message: 'Connexion annulée ou échouée.' });
      }
    } catch (err: any) {
      console.error('[Google Sign-In]', err);
      setErrorModal({ title: 'Erreur', message: err?.response?.data?.message || 'Connexion Google échouée.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        setErrorModal({ title: 'Erreur', message: 'Aucun token reçu d\'Apple.' });
        return;
      }
      const { data: loginData } = await authApi.appleSignIn({
        idToken: credential.identityToken,
        authorizationCode: credential.authorizationCode ?? undefined,
        firstName: credential.fullName?.givenName ?? undefined,
        lastName: credential.fullName?.familyName ?? undefined,
      });
      const { accessToken, refreshToken } = loginData;
      useAuthStore.setState({ accessToken });
      const { data: user } = await authApi.getProfile();
      await setSession(
        { accessToken, refreshToken, expiresAt: Date.now() + (loginData.expiresIn ?? 3600) * 1000 },
        user,
      );
      await completeOnboarding();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const role = useAuthStore.getState().role;
      if (role === 'storeOperator') router.replace('/(storeoperator)/dashboard');
      else if (role === 'partner') router.replace('/(partner)/dashboard');
      else router.replace('/(client)/home');
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return; // User dismissed
      console.error('[Apple Sign-In]', err);
      setErrorModal({ title: 'Erreur', message: err?.response?.data?.message || 'Connexion Apple échouée.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: '#FFFFFF' }]}
      behavior={isIOS ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* ── Top white area: logo + inscription CTA ── */}
      <View style={[styles.logoArea, { paddingTop: insets.top + spacing[4] }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.brand}>maya connect.</Text>
        <Text style={styles.tagline}>Connectez-vous et commencez à économiser</Text>

        {/* Inline signup nudge */}
        <TouchableOpacity
          style={styles.signupNudge}
          onPress={() => router.push('/auth/signup')}
          activeOpacity={0.75}
        >
          <Text style={styles.signupNudgeText}>Pas encore de compte ?</Text>
          <View style={styles.signupNudgePill}>
            <Text style={styles.signupNudgePillText}>Commencer</Text>
            <Ionicons name="arrow-forward" size={wp(12)} color={colors.orange[500]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Dark bubble ── */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={[styles.card, { paddingBottom: insets.bottom + spacing[4] }]}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSub}>Ravi de vous revoir 👋</Text>

          <View style={styles.fields}>
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
          </View>

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
              <Ionicons name="logo-google" size={wp(20)} color="#DB4437" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            {isIOS && (
              <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin}>
                <Ionicons name="logo-apple" size={wp(20)} color="#FFFFFF" />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* ── Error Modal ── */}
      <MModal
        visible={!!errorModal}
        onClose={() => setErrorModal(null)}
        title={errorModal?.title ?? 'Erreur'}
      >
        <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
          <Ionicons name="alert-circle" size={wp(48)} color={colors.error?.[500] ?? '#EF4444'} />
          <Text style={[textStyles.body, { textAlign: 'center', marginTop: spacing[3], color: colors.neutral[600] }]}>
            {errorModal?.message}
          </Text>
        </View>
        <MButton
          title="Compris"
          onPress={() => setErrorModal(null)}
          style={{ marginTop: spacing[3] }}
        />
      </MModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  /* ── Top white area ── */
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[1],
  },
  logoImage: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(16),
    marginBottom: spacing[2],
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
    marginBottom: spacing[3],
  },

  /* Signup nudge */
  signupNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  signupNudgeText: {
    ...textStyles.caption,
    color: colors.neutral[500],
    fontFamily: fontFamily.regular,
  },
  signupNudgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: `${colors.orange[500]}15`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: `${colors.orange[400]}35`,
  },
  signupNudgePillText: {
    fontSize: wp(12),
    fontFamily: fontFamily.semiBold,
    color: colors.orange[500],
  },

  /* ── Dark bubble ── */
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
    paddingBottom: spacing[2],
  },
  cardTitle: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: spacing[1],
  },
  cardSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: spacing[4],
  },

  fields: {
    gap: spacing[1],
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing[1],
    marginBottom: spacing[3],
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
    marginTop: spacing[3],
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
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: spacing[2],
    flex: 1,
    justifyContent: 'center',
  },
  socialText: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.85)',
  },
});
