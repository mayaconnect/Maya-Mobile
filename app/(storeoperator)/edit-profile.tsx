/**
 * Maya Connect V2 — Edit Profile Screen (Store Operator)
 *
 * Dedicated page for modifying personal information.
 * Accessible from the Operator profile page via "Modifier".
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { authApi } from '../../src/api';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { MInput, MButton } from '../../src/components/ui';

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

export default function OperatorEditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; lines: string[] } | null>(null);

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
    mutationFn: (data: FormData) =>
      authApi.updateProfile({
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
      }),
    onSuccess: async () => {
      const res = await authApi.getProfile();
      setUser(res.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessModal(true);
    },
    onError: (err: any) => {
      const responseData = err?.response?.data;
      const validationErrors = responseData?.errors;
      if (validationErrors) {
        const lines = Object.entries(validationErrors)
          .map(([, msgs]) => (msgs as string[]).join(', '))
          .filter(Boolean);
        setErrorModal({ title: 'Erreur de validation', lines });
      } else {
        const msg = responseData?.detail ?? responseData?.title ?? err?.message ?? 'Impossible de mettre à jour le profil.';
        setErrorModal({ title: 'Erreur', lines: [msg] });
      }
    },
  });

  return (
    <View style={styles.container}>
      {/* ── Fixed dark header ── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(24)} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>Modifier le profil</Text>
        <View style={{ width: wp(40) }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: spacing[4], paddingBottom: insets.bottom + wp(40) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Informations personnelles ── */}
        <SectionLabel accent="#7C3AED" title="Informations personnelles" />

        <View style={styles.fieldGroup}>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Prénom"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.firstName?.message}
                    autoCapitalize="words"
                  />
                )}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MInput
                    label="Nom"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.lastName?.message}
                    autoCapitalize="words"
                  />
                )}
              />
            </View>
          </View>

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
                placeholder="+33 6 00 00 00 00"
              />
            )}
          />

          {/* Email — read-only */}
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>Email</Text>
            <View style={styles.readonlyRow}>
              <Ionicons name="mail-outline" size={wp(16)} color="rgba(255,255,255,0.3)" />
              <Text style={styles.readonlyValue}>{user?.email}</Text>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={wp(10)} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </View>
        </View>

        {/* ── Adresse ── */}
        <SectionLabel accent="#38BDF8" title="Adresse" />

        <View style={styles.fieldGroup}>
          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Rue"
                icon="map-outline"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.street?.message}
                placeholder="12 rue de la Paix"
                autoCapitalize="words"
              />
            )}
          />
          <View style={styles.row}>
            <View style={[styles.field, { flex: 0.42 }]}>
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
                    placeholder="75001"
                  />
                )}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
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
                    placeholder="Paris"
                    autoCapitalize="words"
                  />
                )}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
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
                    placeholder="Île-de-France"
                    autoCapitalize="words"
                  />
                )}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
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
                    placeholder="France"
                    autoCapitalize="words"
                  />
                )}
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <MButton
            title="Enregistrer"
            onPress={handleSubmit((d) => updateMutation.mutate(d))}
            loading={updateMutation.isPending}
            disabled={!isDirty || updateMutation.isPending}
          />
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Success Modal ── */}
      <Modal visible={successModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => { setSuccessModal(false); router.back(); }}>
        <Pressable style={mStyles.backdrop} onPress={() => { setSuccessModal(false); router.back(); }}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={mStyles.sheet}>
          <View style={mStyles.handle} />
          <View style={mStyles.successIconWrap}>
            <Ionicons name="checkmark" size={wp(36)} color="#FFFFFF" />
          </View>
          <Text style={mStyles.title}>Profil mis à jour !</Text>
          <Text style={mStyles.body}>Vos informations ont bien été enregistrées.</Text>
          <MButton title="Super !" onPress={() => { setSuccessModal(false); router.back(); }} style={mStyles.btn} />
        </View>
      </Modal>

      {/* ── Error Modal ── */}
      <Modal visible={!!errorModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setErrorModal(null)}>
        <Pressable style={mStyles.backdrop} onPress={() => setErrorModal(null)}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={mStyles.sheet}>
          <View style={mStyles.handle} />
          <View style={mStyles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={wp(36)} color="#EF4444" />
          </View>
          <Text style={mStyles.title}>{errorModal?.title}</Text>
          {errorModal?.lines.map((line, i) => (
            <View key={i} style={mStyles.lineRow}>
              <Ionicons name="close-circle" size={wp(14)} color="#EF4444" style={{ marginTop: 2 }} />
              <Text style={mStyles.lineText}>{line}</Text>
            </View>
          ))}
          <MButton title="Fermer" variant="outline" onPress={() => setErrorModal(null)} style={mStyles.btn} />
        </View>
      </Modal>
    </View>
  );
}

function SectionLabel({ accent, title }: { accent: string; title: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={[sectionStyles.bar, { backgroundColor: accent }]} />
      <Text style={sectionStyles.text}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3], marginTop: spacing[1] },
  bar: { width: wp(3), height: wp(14), borderRadius: wp(2) },
  text: { fontSize: 11, fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.9 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    ...textStyles.h4,
    color: '#FFFFFF',
  },
  scroll: { paddingHorizontal: spacing[5] },
  row: { flexDirection: 'row', gap: spacing[3] },
  field: {},
  fieldGroup: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  readonlyField: { marginTop: spacing[1], marginBottom: spacing[3] },
  readonlyLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: fontFamily.medium, marginBottom: spacing[1], textTransform: 'uppercase', letterSpacing: 0.4 },
  readonlyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg, paddingVertical: spacing[3], paddingHorizontal: spacing[3], borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  readonlyValue: { ...textStyles.body, color: 'rgba(255,255,255,0.3)', flex: 1 },
  lockBadge: { width: wp(22), height: wp(22), borderRadius: wp(11), backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  actions: { gap: spacing[3], marginBottom: spacing[4] },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing[3] },
  cancelText: { ...textStyles.body, color: 'rgba(255,255,255,0.4)', fontFamily: fontFamily.medium },
});

const mStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1E293B', borderTopLeftRadius: wp(32), borderTopRightRadius: wp(32), paddingHorizontal: spacing[6], paddingBottom: spacing[8], alignItems: 'center', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  handle: { width: wp(40), height: wp(4), borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing[3] },
  successIconWrap: { width: wp(80), height: wp(80), borderRadius: wp(40), backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginTop: spacing[2], marginBottom: spacing[4] },
  errorIconWrap: { width: wp(80), height: wp(80), borderRadius: wp(40), backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: spacing[2], marginBottom: spacing[4] },
  title: { ...textStyles.h4, fontFamily: fontFamily.bold, color: '#FFFFFF', textAlign: 'center', marginBottom: spacing[3] },
  body: { ...textStyles.body, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: spacing[6] },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], alignSelf: 'stretch', marginBottom: spacing[2], backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: borderRadius.lg, padding: spacing[3] },
  lineText: { ...textStyles.body, color: 'rgba(255,255,255,0.75)', flex: 1, lineHeight: 20 },
  btn: { width: '100%', marginTop: spacing[4] },
});
