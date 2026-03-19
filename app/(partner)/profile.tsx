/**
 * Maya Connect V2 — Partner Profile Screen
 *
 * Profile management for partner / store operator role.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../src/api/auth.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { profileSchema } from '../../src/utils/validation';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MButton,
  MInput,
  MCard,
  MAvatar,
  MHeader,
  MDivider,
  MModal,
} from '../../src/components/ui';

interface MenuItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color?: string;
  onPress: () => void;
}

export default function PartnerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [isEditing, setIsEditing] = useState(false);

  /* ---- Profile query ---- */
  const profileQ = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    select: (res) => res.data,
    initialData: { data: user } as any,
  });

  const profile = profileQ.data ?? user;

  /* ---- Form ---- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
    },
  });

  // Resync form quand les données du profil arrivent depuis le serveur
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phoneNumber: profile.phoneNumber ?? '',
      });
    }
  }, [profile?.firstName, profile?.lastName, profile?.phoneNumber]);

  /* ---- Update profile ---- */
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        address: { street: '', city: '', state: '', postalCode: '', country: '' },
      };
      console.log('[Profile] updateProfile — payload:', JSON.stringify(payload));
      return authApi.updateProfile(payload);
    },
    onSuccess: (res) => {
      console.log('[Profile] updateProfile success:', res.status, JSON.stringify(res.data));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(res.data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => {
      const responseData = err?.response?.data;
      console.log('[Profile] updateProfile ERROR:', {
        status: err?.response?.status,
        data: JSON.stringify(responseData),
        message: err?.message,
      });
      const validationErrors = responseData?.errors;
      if (validationErrors) {
        const lines = Object.entries(validationErrors)
          .map(([field, msgs]) => `${(msgs as string[]).join(', ')}`)
          .filter(Boolean);
        console.log('[Profile] validation fields:', lines.join(' | '));
        setErrorModal({ title: 'Erreur de validation', lines });
      } else {
        const detail = responseData?.detail ?? responseData?.title ?? err?.message ?? 'Impossible de mettre à jour le profil.';
        setErrorModal({ title: 'Erreur', lines: [detail] });
      }
    },
  });

  /* ---- Avatar upload ---- */
  const avatarMutation = useMutation({
    mutationFn: async (uri: string) => {
      const form = new FormData();
      form.append('file', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);
      return authApi.uploadAvatar(form);
    },
    onSuccess: (res) => {
      setUser({ ...profile, avatarUrl: res.data?.avatarUrl } as any);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      avatarMutation.mutate(result.assets[0].uri);
    }
  };

  /* ---- Logout ---- */
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ title: string; lines: string[] } | null>(null);

  const confirmLogout = async () => {
    try {
      if (refreshToken) await authApi.logout({ refreshToken });
    } catch {}
    await logout();
    queryClient.clear();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/auth/login');
  };

  const handleLogout = () => setShowLogoutModal(true);

  const menuItems: MenuItem[] = [
    {
      icon: 'storefront-outline',
      label: 'Mes magasins',
      onPress: () => router.push('/(partner)/stores'),
    },
    {
      icon: 'receipt-outline',
      label: 'Historique des transactions',
      onPress: () => router.push('/(partner)/history'),
    },
    {
      icon: 'scan-outline',
      label: 'Scanner un QR code',
      onPress: () => router.push('/(partner)/scanner'),
    },
    {
      icon: 'lock-closed-outline',
      label: 'Changer le mot de passe',
      onPress: () => router.push('/(client)/change-password' as any),
    },
  ];

  const roleName = profile?.role?.toLowerCase?.() ??
    profile?.roles?.[0]?.name?.toLowerCase?.() ?? '';

  return (
    <View style={styles.container}>
      {/* Gradient header with rounded bottom */}
      <LinearGradient
        colors={['#FF6A00', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[3] }]}
      >
        {/* Avatar centré */}
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
          <MAvatar
            name={profile?.firstName ?? 'P'}
            uri={profile?.avatarUrl}
            size="lg"
          />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={wp(14)} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.profileName}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>

        {roleName ? (
          <View style={styles.roleBadge}>
            <Ionicons name="briefcase-outline" size={wp(11)} color="#FFFFFF" />
            <Text style={styles.roleText}>
              {roleName === 'partner' ? 'Partenaire' : 'Opérateur'}
            </Text>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Edit form */}
        <MCard style={styles.formCard} elevation="sm">
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleIcon}>
                <Ionicons name="person-outline" size={wp(16)} color={colors.violet[500]} />
              </View>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
            </View>
            <TouchableOpacity
              style={[styles.editBtnWrap, isEditing && styles.editBtnWrapActive]}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={[styles.editBtn, isEditing && styles.editBtnActive]}>
                {isEditing ? 'Annuler' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>

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
                editable={isEditing}
                icon="person-outline"
              />
            )}
          />
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
                editable={isEditing}
                icon="person-outline"
              />
            )}
          />
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <MInput
                label="Téléphone"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phoneNumber?.message}
                editable={isEditing}
                keyboardType="phone-pad"
                icon="call-outline"
              />
            )}
          />

          {isEditing && (
            <MButton
              title="Enregistrer les modifications"
              onPress={handleSubmit(
                (data) => updateMutation.mutate(data),
                (validationErrors) => console.log('[Profile] form validation errors:', JSON.stringify(validationErrors)),
              )}
              loading={updateMutation.isPending}
              disabled={!isDirty}
              style={{ marginTop: spacing[3] }}
            />
          )}
        </MCard>

        {/* Navigation rapide */}
        <MCard style={styles.menuCard} elevation="sm">
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleIcon}>
                <Ionicons name="apps-outline" size={wp(16)} color={colors.violet[500]} />
              </View>
              <Text style={styles.cardTitle}>Navigation</Text>
            </View>
          </View>
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIcon, item.color ? { backgroundColor: `${item.color}18` } : undefined]}>
                  <Ionicons name={item.icon} size={wp(20)} color={item.color ?? colors.violet[500]} />
                </View>
                <Text style={[styles.menuLabel, item.color ? { color: item.color } : undefined]}>
                  {item.label}
                </Text>
                <View style={styles.chevronBox}>
                  <Ionicons name="chevron-forward" size={wp(14)} color={colors.neutral[400]} />
                </View>
              </TouchableOpacity>
              {idx < menuItems.length - 1 && <MDivider />}
            </React.Fragment>
          ))}
        </MCard>

        {/* Déconnexion */}
        <MCard style={styles.logoutCard} elevation="sm">
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: `${colors.error[500]}18` }]}>
              <Ionicons name="log-out-outline" size={wp(20)} color={colors.error[500]} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.error[500] }]}>
              Se déconnecter
            </Text>
            <View style={styles.chevronBox}>
              <Ionicons name="chevron-forward" size={wp(14)} color={colors.error[300]} />
            </View>
          </TouchableOpacity>
        </MCard>

        <View style={{ height: wp(100) }} />
      </ScrollView>

      {/* Error modal */}
      <Modal visible={!!errorModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setErrorModal(null)}>
        <Pressable style={mStyles.backdrop} onPress={() => setErrorModal(null)}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={mStyles.sheet}>
          <View style={mStyles.handle} />
          <View style={mStyles.iconWrap}>
            <Ionicons name="alert-circle-outline" size={wp(36)} color={colors.error[500]} />
          </View>
          <Text style={mStyles.title}>{errorModal?.title}</Text>
          {errorModal?.lines.map((line, i) => (
            <View key={i} style={mStyles.lineRow}>
              <Ionicons name="close-circle" size={wp(14)} color={colors.error[400]} style={{ marginTop: 2 }} />
              <Text style={mStyles.lineText}>{line}</Text>
            </View>
          ))}
          <MButton title="Fermer" variant="outline" onPress={() => setErrorModal(null)} style={mStyles.btn} />
        </View>
      </Modal>

      {/* Logout confirmation modal */}
      <MModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Déconnexion"
      >
        <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
          <View style={styles.logoutModalIcon}>
            <Ionicons name="log-out-outline" size={wp(32)} color={colors.error[500]} />
          </View>
          <Text style={[textStyles.body, { textAlign: 'center', marginTop: spacing[3], color: colors.neutral[600] }]}>
            Êtes-vous sûr de vouloir vous déconnecter ?
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}>
          <MButton
            title="Annuler"
            variant="outline"
            onPress={() => setShowLogoutModal(false)}
            style={{ flex: 1 }}
          />
          <MButton
            title="Déconnecter"
            variant="danger"
            onPress={confirmLogout}
            style={{ flex: 1 }}
          />
        </View>
      </MModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  /* ── Header ── */
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    alignItems: 'center',
    borderBottomLeftRadius: wp(32),
    borderBottomRightRadius: wp(32),
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: colors.violet[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    ...textStyles.h3,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  profileEmail: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing[1],
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },

  /* ── Scroll ── */
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing[4],
    paddingTop: spacing[5],
  },

  /* ── Cards ── */
  formCard: {
    marginBottom: spacing[3],
    backgroundColor: '#111827',
  },
  menuCard: {
    marginBottom: spacing[3],
    backgroundColor: '#111827',
  },
  logoutCard: {
    marginBottom: spacing[3],
    backgroundColor: '#111827',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  cardTitleIcon: {
    width: wp(30),
    height: wp(30),
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  editBtnWrap: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: colors.violet[50],
  },
  editBtnWrapActive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  editBtn: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[600],
  },
  editBtnActive: {
    color: colors.error[500],
  },

  /* ── Menu items ── */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  menuIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuLabel: {
    ...textStyles.body,
    color: colors.neutral[900],
    flex: 1,
  },
  chevronBox: {
    width: wp(28),
    height: wp(28),
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Error modal ── */
  errorModalIcon: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: `${colors.error[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Logout modal ── */
  logoutModalIcon: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: `${colors.error[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const mStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    alignItems: 'center',
  },
  handle: {
    width: wp(40),
    height: wp(4),
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[3],
  },
  iconWrap: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: `${colors.error[500]}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  title: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    alignSelf: 'stretch',
    marginBottom: spacing[2],
    backgroundColor: `${colors.error[500]}08`,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
  },
  lineText: {
    ...textStyles.body,
    color: colors.neutral[700],
    flex: 1,
    lineHeight: 20,
  },
  btn: {
    width: '100%',
    marginTop: spacing[4],
  },
});
