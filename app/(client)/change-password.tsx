/**
 * Maya Connect V2 — Change Password Screen
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../src/api';
import { colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { MInput, MButton } from '../../src/components/ui';

const schema = z.object({
  currentPassword: z.string().min(6, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      reset();
    },
    onError: () => {
      Alert.alert('Erreur', 'Mot de passe actuel incorrect ou erreur de connexion.');
    },
  });

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: '#FFFFFF' }]}
      behavior={isIOS ? 'padding' : undefined}
    >
      {/* Top area — blanc */}
      <View style={[styles.topArea, { paddingTop: insets.top + spacing[3] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(24)} color={colors.neutral[700]} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={wp(32)} color={colors.orange[500]} />
        </View>
        <Text style={styles.heading}>Changer le mot de passe</Text>
        <Text style={styles.sub}>
          Choisissez un mot de passe fort combinant lettres, chiffres et caractères spéciaux.
        </Text>
      </View>

      {/* Card sombre */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
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
    top: 0,
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
});
