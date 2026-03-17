/**
 * Maya Connect V2 — Forgot Password Screen
 *
 * 3-step flow:
 * 1. Enter email → request reset code
 * 2. Enter 6-digit code → verify
 * 3. Enter new password → reset
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { authApi } from '../../src/api/auth.api';
import {
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
  type ForgotPasswordFormData,
  type VerifyCodeFormData,
  type ResetPasswordFormData,
} from '../../src/utils/validation';
import { colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { MButton, MInput } from '../../src/components/ui';

type Step = 'email' | 'code' | 'reset';

const STEPS: Record<Step, { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }> = {
  email: {
    title: 'Mot de passe oublié',
    sub: 'Entrez votre adresse e-mail pour recevoir un code de vérification.',
    icon: 'mail-outline',
  },
  code: {
    title: 'Vérification',
    sub: 'Un code à 6 chiffres a été envoyé à votre adresse. Saisissez-le ci-dessous.',
    icon: 'keypad-outline',
  },
  reset: {
    title: 'Nouveau mot de passe',
    sub: 'Choisissez un mot de passe sécurisé pour votre compte.',
    icon: 'lock-closed-outline',
  },
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const codeForm = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleEmailSubmit = async (data: ForgotPasswordFormData) => {
    console.log('[ForgotPassword] Step 1 — requesting code for:', data.email);
    try {
      setLoading(true);
      const res = await authApi.requestPasswordResetCode({ email: data.email });
      console.log('[ForgotPassword] requestPasswordResetCode response:', res.status, JSON.stringify(res.data));
      setEmail(data.email);
      setStep('code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.log('[ForgotPassword] Step 1 ERROR:', {
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        message: err?.message,
      });
      Alert.alert('Erreur', err?.response?.data?.detail || "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (data: VerifyCodeFormData) => {
    console.log('[ForgotPassword] Step 2 — verifying code:', data.code, 'for email:', email);
    try {
      setLoading(true);
      const res = await authApi.verifyPasswordResetCode({ email, code: data.code });
      console.log('[ForgotPassword] verifyPasswordResetCode response:', res.status, JSON.stringify(res.data));
      const token = (res.data as any)?.token || (res.data as any)?.resetToken || data.code;
      console.log('[ForgotPassword] Token extracted for reset:', token);
      setCode(data.code);
      setResetToken(token);
      setStep('reset');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.log('[ForgotPassword] Step 2 ERROR:', {
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        message: err?.message,
      });
      Alert.alert('Code invalide', err?.response?.data?.detail || 'Le code est incorrect ou a expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetPasswordFormData) => {
    console.log('[ForgotPassword] Step 3 — resetting password, resetToken:', resetToken, '| code:', code);
    try {
      setLoading(true);
      const res = await authApi.resetPassword({ token: resetToken, newPassword: data.password });
      console.log('[ForgotPassword] resetPassword response:', res.status, JSON.stringify(res.data));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Mot de passe réinitialisé',
        'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }],
      );
    } catch (err: any) {
      console.log('[ForgotPassword] Step 3 ERROR:', {
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        message: err?.message,
      });
      Alert.alert('Erreur', err?.response?.data?.detail || 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const current = STEPS[step];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: '#FFFFFF' }]}
      behavior={isIOS ? 'padding' : undefined}
    >
      {/* Haut blanc — icône + titre + subtitle */}
      <View style={[styles.topArea, { paddingTop: insets.top + spacing[3] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(24)} color={colors.neutral[700]} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name={current.icon} size={wp(32)} color={colors.orange[500]} />
        </View>
        <Text style={styles.heading}>{current.title}</Text>
        <Text style={styles.sub}>{current.sub}</Text>

        {/* Indicateur d'étapes */}
        <View style={styles.stepsRow}>
          {(['email', 'code', 'reset'] as Step[]).map((s, i) => (
            <View
              key={s}
              style={[styles.stepDot, step === s && styles.stepDotActive, i < ['email', 'code', 'reset'].indexOf(step) && styles.stepDotDone]}
            />
          ))}
        </View>
      </View>

      {/* Bulle sombre en bas */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={[styles.card, { paddingBottom: insets.bottom + spacing[6] }]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardContent}
        >
          {step === 'email' && (
            <>
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Adresse e-mail"
                    icon="mail-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={emailForm.formState.errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required
                  />
                )}
              />
              <MButton
                title="Envoyer le code"
                onPress={emailForm.handleSubmit(handleEmailSubmit)}
                loading={loading}
                style={{ marginTop: spacing[2] }}
              />
            </>
          )}

          {step === 'code' && (
            <>
              <Controller
                control={codeForm.control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Code de vérification"
                    icon="keypad-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={codeForm.formState.errors.code?.message}
                    keyboardType="number-pad"
                    maxLength={6}
                    required
                  />
                )}
              />
              <MButton
                title="Vérifier le code"
                onPress={codeForm.handleSubmit(handleCodeSubmit)}
                loading={loading}
                style={{ marginTop: spacing[2] }}
              />
              <TouchableOpacity style={styles.resendBtn} onPress={() => setStep('email')}>
                <Text style={styles.resendText}>Renvoyer le code</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'reset' && (
            <>
              <Controller
                control={resetForm.control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Nouveau mot de passe"
                    icon="lock-closed-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={resetForm.formState.errors.password?.message}
                    secureTextEntry
                    required
                  />
                )}
              />
              <Controller
                control={resetForm.control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Confirmer le mot de passe"
                    icon="shield-checkmark-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={resetForm.formState.errors.confirmPassword?.message}
                    secureTextEntry
                    required
                  />
                )}
              />
              <MButton
                title="Réinitialiser"
                onPress={resetForm.handleSubmit(handleResetSubmit)}
                loading={loading}
                style={{ marginTop: spacing[2] }}
              />
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  topArea: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  backBtn: {
    position: 'absolute',
    top: spacing[5],
    left: spacing[4],
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  heading: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  sub: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing[2],
  },
  stepsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  stepDot: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: colors.neutral[200],
  },
  stepDotActive: {
    backgroundColor: colors.orange[500],
    width: wp(20),
  },
  stepDotDone: {
    backgroundColor: colors.orange[300],
  },

  /* Bulle sombre */
  card: {
    flex: 3,
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  cardContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  resendBtn: {
    alignSelf: 'center',
    marginTop: spacing[4],
  },
  resendText: {
    ...textStyles.caption,
    color: colors.orange[400],
    fontFamily: fontFamily.medium,
  },
});
