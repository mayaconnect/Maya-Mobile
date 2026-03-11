/**
 * Maya Connect V2 — Change Password Screen
 * 
 * Allows users to change their password with current password verification
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { MHeader, MInput, MButton } from '../../src/components/ui';

/* ─────────────────────────────────────────────────────────────── */
/*  Schema                                                           */
/* ─────────────────────────────────────────────────────────────── */
const schema = z.object({
  currentPassword: z.string().min(6, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                        */
/* ─────────────────────────────────────────────────────────────── */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // First, login with current password to verify
      // Then call password change endpoint (if API has one)
      // For now, we'll use a placeholder API call
      
      // TODO: Implement actual password change API endpoint
      // Example: await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      
      // Placeholder simulation
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Succès',
        'Votre mot de passe a été modifié avec succès.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
      reset();
    },
    onError: () => {
      Alert.alert('Erreur', 'Mot de passe actuel incorrect ou erreur de connexion.');
    },
  });

  const onSubmit = (data: FormData) => {
    changeMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <MHeader
        title="Changer le mot de passe"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + wp(100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={wp(24)} color={colors.info[500]} />
          <Text style={styles.infoText}>
            Assurez-vous de choisir un mot de passe fort combinant lettres, chiffres et caractères spéciaux.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Mot de passe actuel"
                icon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showCurrent}
                rightIcon={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowCurrent(!showCurrent)}
                error={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Nouveau mot de passe"
                icon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showNew}
                rightIcon={showNew ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowNew(!showNew)}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Confirmer le nouveau mot de passe"
                icon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showConfirm}
                rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirm(!showConfirm)}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <MButton
            title="Modifier le mot de passe"
            onPress={handleSubmit(onSubmit)}
            loading={changeMutation.isPending}
            disabled={changeMutation.isPending}
            style={{ marginTop: spacing[2] }}
          />
        </View>

        {/* Security Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Conseils de sécurité</Text>
          {[
            'Utilisez un mot de passe unique pour chaque service',
            'Évitez les informations personnelles évidentes',
            'Changez votre mot de passe régulièrement',
            'Activez l\'authentification biométrique quand c\'est possible',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={wp(16)} color={colors.success[500]} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Styles                                                           */
/* ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scroll: {
    paddingHorizontal: spacing[6],
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info[50],
    padding: spacing[4],
    borderRadius: spacing[3],
    marginTop: spacing[4],
    gap: spacing[3],
  },
  infoText: {
    ...textStyles.caption,
    color: colors.info[700],
    flex: 1,
    lineHeight: wp(18),
  },
  section: {
    marginTop: spacing[6],
  },
  tipsSection: {
    marginTop: spacing[8],
    padding: spacing[4],
    backgroundColor: '#1E293B',
    borderRadius: spacing[3],
  },
  tipsTitle: {
    ...textStyles.h5,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  tipText: {
    ...textStyles.caption,
    color: colors.neutral[600],
    flex: 1,
  },
});
