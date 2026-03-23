/**
 * Maya Connect V2 — Edit Profile Screen (Store Operator)
 */
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
import { authApi } from '../../src/api';
import { MAvatar, MButton } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { borderRadius, spacing } from '../../src/theme/spacing';
import { fontFamily } from '../../src/theme/typography';
import { wp } from '../../src/utils/responsive';

const FIELD_FR: Record<string, string> = {
  firstName: 'Prénom', lastname: 'Nom', lastName: 'Nom',
  phoneNumber: 'Téléphone', phone: 'Téléphone',
  street: 'Rue', city: 'Ville', state: 'Région',
  postalCode: 'Code postal', country: 'Pays',
  email: 'Email', address: 'Adresse',
};

function translateError(field: string, msg: string): string {
  const fieldFr = FIELD_FR[field] ?? field;
  return msg
    .replace(/^The\s+\w+\s+field\s+is\s+required\.?$/i, `${fieldFr} est requis.`)
    .replace(/is required/gi, 'est requis')
    .replace(/is invalid/gi, 'est invalide')
    .replace(/must be/gi, 'doit être')
    .replace(/already exists/gi, 'existe déjà')
    .replace(/\bThe\b/g, 'Le champ')
    .replace(/\bfield\b/gi, '');
}

const schema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phoneNumber: z.string().nullable(),
  street: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
});

type FormData = z.infer<typeof schema>;

/* ─── Custom field ─── */
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  error?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  readonly?: boolean;
  rightElement?: React.ReactNode;
}

function Field({ label, value, onChangeText, onBlur, placeholder, icon, error, keyboardType, autoCapitalize, readonly, rightElement }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  return (
    <TouchableOpacity
      activeOpacity={readonly ? 1 : 0.9}
      onPress={() => !readonly && inputRef.current?.focus()}
      style={[fStyles.wrap, focused && fStyles.wrapFocused, !!error && fStyles.wrapError, readonly && fStyles.wrapReadonly]}
    >
      {icon && (
        <View style={[fStyles.iconBox, focused && fStyles.iconBoxFocused]}>
          <Ionicons name={icon} size={wp(16)} color={focused ? '#FF7A18' : 'rgba(255,255,255,0.25)'} />
        </View>
      )}
      <View style={fStyles.inner}>
        <Text style={[fStyles.label, focused && fStyles.labelFocused, !!error && fStyles.labelError]}>{label}</Text>
        {readonly ? (
          <Text style={fStyles.readonlyText} numberOfLines={1}>{value || '—'}</Text>
        ) : (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onBlur={() => { setFocused(false); onBlur?.(); }}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.18)"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize ?? 'none'}
            style={fStyles.input}
          />
        )}
      </View>
      {rightElement && <View style={fStyles.right}>{rightElement}</View>}
      {focused && !readonly && <View style={fStyles.focusBar} />}
    </TouchableOpacity>
  );
}

const fStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A2640', borderRadius: borderRadius.xl, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', paddingHorizontal: spacing[3], paddingVertical: 10, marginBottom: spacing[3], gap: spacing[2], position: 'relative', overflow: 'hidden' },
  wrapFocused: { borderColor: '#FF7A18', backgroundColor: '#1E2D45' },
  wrapError: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.05)' },
  wrapReadonly: { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.04)' },
  iconBox: { width: wp(28), height: wp(28), borderRadius: borderRadius.md, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconBoxFocused: { backgroundColor: 'rgba(255,122,24,0.15)' },
  inner: { flex: 1 },
  label: { fontSize: wp(10), fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  labelFocused: { color: '#FF7A18' },
  labelError: { color: '#EF4444' },
  input: { fontSize: wp(14), fontFamily: fontFamily.medium, color: '#FFFFFF', padding: 0, margin: 0 },
  readonlyText: { fontSize: wp(14), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.2)' },
  right: { flexShrink: 0 },
  focusBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#FF7A18', borderTopLeftRadius: borderRadius.xl, borderBottomLeftRadius: borderRadius.xl },
});

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <View style={errStyles.row}>
      <Ionicons name="alert-circle" size={wp(12)} color="#EF4444" />
      <Text style={errStyles.text}>{msg}</Text>
    </View>
  );
}
const errStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -spacing[1], marginBottom: spacing[1] },
  text: { fontSize: wp(10), fontFamily: fontFamily.regular, color: '#EF4444' },
});

function SectionHead({ icon, label, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string }) {
  return (
    <View style={shStyles.row}>
      <View style={[shStyles.dot, { backgroundColor: color }]} />
      <Ionicons name={icon} size={wp(13)} color={color} />
      <Text style={[shStyles.text, { color }]}>{label}</Text>
      <View style={[shStyles.line, { backgroundColor: `${color}22` }]} />
    </View>
  );
}
const shStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3], marginTop: spacing[5] },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: wp(11), fontFamily: fontFamily.bold, textTransform: 'uppercase', letterSpacing: 1 },
  line: { flex: 1, height: 1 },
});

/* ─── Main screen ─── */
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

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Opérateur';

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      authApi.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: { street: data.street, city: data.city, state: data.state, postalCode: data.postalCode, country: data.country },
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
          .flatMap(([field, msgs]) => (msgs as string[]).map((m) => translateError(field, m)))
          .filter(Boolean);
        setErrorModal({ title: 'Erreur de validation', lines });
      } else {
        const msg = responseData?.detail ?? responseData?.title ?? err?.message ?? 'Impossible de mettre à jour le profil.';
        setErrorModal({ title: 'Erreur', lines: [msg] });
      }
    },
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={wp(20)} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.topMeta}>
            <MAvatar uri={user?.avatarUrl} name={fullName} size="sm" />
            <View>
              <Text style={styles.topName}>{fullName}</Text>
              <Text style={styles.topSub}>Modifier le profil</Text>
            </View>
          </View>
        </View>

        {/* Identité */}
        <SectionHead icon="person-outline" label="Identité" color="#FF7A18" />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="firstName" render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Field label="Prénom" value={value} onChangeText={onChange} onBlur={onBlur} icon="person-outline" placeholder="Jean" autoCapitalize="words" error={errors.firstName?.message} />
                <FieldError msg={errors.firstName?.message} />
              </>
            )} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="lastName" render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Field label="Nom" value={value} onChangeText={onChange} onBlur={onBlur} icon="person-outline" placeholder="Dupont" autoCapitalize="words" error={errors.lastName?.message} />
                <FieldError msg={errors.lastName?.message} />
              </>
            )} />
          </View>
        </View>

        <Controller control={control} name="phoneNumber" render={({ field: { onChange, onBlur, value } }) => (
          <>
            <Field label="Téléphone" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} icon="call-outline" placeholder="+33 6 00 00 00 00" keyboardType="phone-pad" error={errors.phoneNumber?.message} />
            <FieldError msg={errors.phoneNumber?.message} />
          </>
        )} />

        <Field
          label="Email" value={user?.email ?? ''} onChangeText={() => {}} icon="mail-outline" readonly
          rightElement={
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={wp(10)} color="rgba(255,255,255,0.2)" />
              <Text style={styles.lockText}>Fixe</Text>
            </View>
          }
        />

        {/* Adresse */}
        <SectionHead icon="location-outline" label="Adresse" color="#38BDF8" />

        <Controller control={control} name="street" render={({ field: { onChange, onBlur, value } }) => (
          <>
            <Field label="Rue" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} icon="map-outline" placeholder="12 rue de la Paix" autoCapitalize="words" error={errors.street?.message} />
            <FieldError msg={errors.street?.message} />
          </>
        )} />

        <View style={styles.row}>
          <View style={{ flex: 0.42 }}>
            <Controller control={control} name="postalCode" render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Field label="Code postal" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="75001" keyboardType="numeric" error={errors.postalCode?.message} />
                <FieldError msg={errors.postalCode?.message} />
              </>
            )} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="city" render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Field label="Ville" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="Paris" autoCapitalize="words" error={errors.city?.message} />
                <FieldError msg={errors.city?.message} />
              </>
            )} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="state" render={({ field: { onChange, onBlur, value } }) => (
              <Field label="Région" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="Île-de-France" autoCapitalize="words" />
            )} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="country" render={({ field: { onChange, onBlur, value } }) => (
              <Field label="Pays" value={value ?? ''} onChangeText={onChange} onBlur={onBlur} placeholder="France" autoCapitalize="words" />
            )} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleSubmit((d) => updateMutation.mutate(d))}
            disabled={!isDirty || updateMutation.isPending}
            activeOpacity={0.85}
            style={[styles.saveBtn, (!isDirty || updateMutation.isPending) && { opacity: 0.45 }]}
          >
            <LinearGradient colors={['#FF6A00', '#FF9F45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnInner}>
              {updateMutation.isPending ? (
                <Text style={styles.saveBtnText}>Enregistrement…</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={wp(18)} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => { setSuccessModal(false); router.back(); }}>
        <Pressable style={mStyles.backdrop} onPress={() => { setSuccessModal(false); router.back(); }} />
        <View style={mStyles.sheet}>
          <View style={mStyles.handle} />
          <LinearGradient colors={['#22C55E', '#16A34A']} style={mStyles.iconCircle}>
            <Ionicons name="checkmark" size={wp(36)} color="#FFFFFF" />
          </LinearGradient>
          <Text style={mStyles.title}>Profil mis à jour !</Text>
          <Text style={mStyles.body}>Vos informations ont bien été enregistrées.</Text>
          <MButton title="Super !" onPress={() => { setSuccessModal(false); router.back(); }} style={mStyles.btn} />
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={!!errorModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setErrorModal(null)}>
        <Pressable style={mStyles.backdrop} onPress={() => setErrorModal(null)} />
        <View style={mStyles.sheet}>
          <View style={mStyles.handle} />
          <View style={[mStyles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { paddingHorizontal: spacing[4] },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] },
  backBtn: { width: wp(38), height: wp(38), borderRadius: borderRadius.lg, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  topMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  topName: { fontSize: wp(15), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  topSub: { fontSize: wp(11), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  row: { flexDirection: 'row', gap: spacing[3] },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.full, paddingHorizontal: spacing[2], paddingVertical: 3 },
  lockText: { fontSize: wp(9), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.2)' },
  actions: { marginTop: spacing[5], gap: spacing[3] },
  saveBtn: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  saveBtnText: { fontSize: wp(14), fontFamily: fontFamily.semiBold, color: '#FFFFFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing[2] },
  cancelText: { fontSize: wp(12), fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.3)' },
});

const mStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1E293B', borderTopLeftRadius: wp(28), borderTopRightRadius: wp(28), paddingHorizontal: spacing[6], paddingBottom: spacing[10], alignItems: 'center', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  handle: { width: wp(40), height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: spacing[3] },
  iconCircle: { width: wp(80), height: wp(80), borderRadius: wp(40), alignItems: 'center', justifyContent: 'center', marginTop: spacing[2], marginBottom: spacing[4] },
  title: { fontSize: wp(18), fontFamily: fontFamily.bold, color: '#FFFFFF', textAlign: 'center', marginBottom: spacing[2] },
  body: { fontSize: wp(13), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: spacing[6] },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], alignSelf: 'stretch', marginBottom: spacing[2], backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: borderRadius.lg, padding: spacing[3] },
  lineText: { fontSize: wp(13), fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.7)', flex: 1, lineHeight: 20 },
  btn: { width: '100%', marginTop: spacing[4] },
});
