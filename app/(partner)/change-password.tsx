/**
 * Maya Connect V2 — Change Password Screen (Partner)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../src/api';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { MInput, MButton } from '../../src/components/ui';
import { useAppAlert } from '../../src/hooks/use-app-alert';

const schema = z.object({
  currentPassword: z.string().min(6, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function PartnerChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { alert, AlertModal } = useAppAlert();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert('Succès', 'Votre mot de passe a été modifié avec succès.', 'success');
      reset();
      setTimeout(() => router.back(), 2000);
    },
    onError: () => {
      alert('Erreur', 'Mot de passe actuel incorrect ou erreur de connexion.');
    },
  });

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: '#0F172A' }]}
      behavior={isIOS ? 'padding' : undefined}
    >
      {/* Top area — dark */}
      <View style={[styles.topArea, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(24)} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={wp(32)} color={colors.violet[400]} />
        </View>
        <Text style={styles.heading}>Changer le mot de passe</Text>
        <Text style={styles.sub}>
          Choisissez un mot de passe fort combinant lettres, chiffres et caractères spéciaux.
        </Text>
      </View>

      {/* Card sombre */}
      <LinearGradient
        colors={['#1a1b3e', '#0D0E20']}
        style={[styles.card, { paddingBottom: insets.bottom + spacing[6] }]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardContent}
        >
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
                label="Confirmer le mot de passe"
                icon="shield-checkmark-outline"
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
            onPress={handleSubmit((data) => changeMutation.mutate(data))}
            loading={changeMutation.isPending}
            disabled={changeMutation.isPending}
            style={{ marginTop: spacing[2] }}
          />
        </ScrollView>
      </LinearGradient>
      <AlertModal />
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
    backgroundColor: '#0F172A',
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: spacing[4],
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  heading: {
    ...textStyles.h3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  sub: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    flex: 3,
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[1],
  },
});
