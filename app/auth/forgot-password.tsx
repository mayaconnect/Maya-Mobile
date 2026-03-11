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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { spacing } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { MButton, MInput, MHeader } from '../../src/components/ui';

type Step = 'email' | 'code' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  /* ----- Step 1: Email form ----- */
  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleEmailSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await authApi.requestPasswordResetCode({ email: data.email });
      setEmail(data.email);
      setStep('code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err?.response?.data?.detail || 'Impossible d\'envoyer le code. Vérifiez votre adresse e-mail.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* ----- Step 2: Code form ----- */
  const codeForm = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  const handleCodeSubmit = async (data: VerifyCodeFormData) => {
    try {
      setLoading(true);
      await authApi.verifyPasswordResetCode({ email, code: data.code });
      setCode(data.code);
      setStep('reset');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert(
        'Code invalide',
        err?.response?.data?.detail || 'Le code saisi est incorrect ou a expiré.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* ----- Step 3: New password form ----- */
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleResetSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      await authApi.resetPassword({
        token: code,
        newPassword: data.password,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Mot de passe réinitialisé',
        'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }],
      );
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err?.response?.data?.detail || 'Impossible de réinitialiser votre mot de passe.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* ----- Step config ----- */
  const steps: Record<Step, { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }> = {
    email: {
      title: 'Mot de passe oublié',
      sub: 'Entrez votre adresse e-mail pour recevoir un code de vérification.',
      icon: 'mail-outline',
    },
    code: {
      title: 'Vérification',
      sub: `Un code à 6 chiffres a été envoyé à ${email}. Saisissez-le ci-dessous.`,
      icon: 'keypad-outline',
    },
    reset: {
      title: 'Nouveau mot de passe',
      sub: 'Choisissez un mot de passe sécurisé pour votre compte.',
      icon: 'lock-closed-outline',
    },
  };

  const currentStep = steps[step];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={isIOS ? 'padding' : undefined}
    >
      <MHeader title="Réinitialisation" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name={currentStep.icon} size={wp(32)} color={colors.orange[500]} />
        </View>

        <Text style={styles.heading}>{currentStep.title}</Text>
        <Text style={styles.sub}>{currentStep.sub}</Text>

        {/* Step 1 */}
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

        {/* Step 2 */}
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
              title="Vérifier"
              onPress={codeForm.handleSubmit(handleCodeSubmit)}
              loading={loading}
              style={{ marginTop: spacing[2] }}
            />
          </>
        )}

        {/* Step 3 */}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  iconCircle: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  heading: {
    ...textStyles.h3,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  sub: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[2],
  },
});
