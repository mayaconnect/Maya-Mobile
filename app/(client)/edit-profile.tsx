/**
 * Maya Connect V2 — Edit Profile Screen
 * 
 * Allows users to view and edit:
 * - Personal information (first name, last name, phone)
 * - Address (street, city, state, postal code, country)
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
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { MHeader, MInput, MButton, MDivider } from '../../src/components/ui';

/* ─────────────────────────────────────────────────────────────── */
/*  Schema                                                           */
/* ─────────────────────────────────────────────────────────────── */
const schema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  phoneNumber: z.string().nullable(),
  street: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                        */
/* ─────────────────────────────────────────────────────────────── */
export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || null,
      street: user?.address?.street || null,
      city: user?.address?.city || null,
      state: user?.address?.state || null,
      postalCode: user?.address?.postalCode || null,
      country: user?.address?.country || null,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
        },
      };
      return authApi.updateProfile(payload);
    },
    onSuccess: async () => {
      const res = await authApi.getProfile();
      setUser(res.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Votre profil a été mis à jour.');
      router.back();
    },
    onError: () => {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <MHeader
        title="Modifier le profil"
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
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Prénom"
                icon="person-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.firstName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Nom"
                icon="person-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.lastName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Téléphone"
                icon="call-outline"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                error={errors.phoneNumber?.message}
              />
            )}
          />
        </View>

        <MDivider />

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse</Text>

          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Rue"
                icon="location-outline"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.street?.message}
              />
            )}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="postalCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Code postal"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    error={errors.postalCode?.message}
                  />
                )}
              />
            </View>

            <View style={styles.halfField}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Ville"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.city?.message}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Région"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.state?.message}
                  />
                )}
              />
            </View>

            <View style={styles.halfField}>
              <Controller
                control={control}
                name="country"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Pays"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.country?.message}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <MButton
            title="Enregistrer les modifications"
            onPress={handleSubmit(onSubmit)}
            loading={updateMutation.isPending}
            disabled={!isDirty || updateMutation.isPending}
          />
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
  section: {
    marginTop: spacing[6],
  },
  sectionTitle: {
    ...textStyles.h5,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfField: {
    flex: 1,
  },
});
