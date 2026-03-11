/**
 * Maya Connect V2 — Partner Profile Screen
 *
 * Profile management for partner / store operator role.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
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
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
    },
  });

  /* ---- Update profile ---- */
  const updateMutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(res.data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
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
  ];

  return (
    <View style={styles.container}>
      {/* Navy gradient header */}
      <LinearGradient
        colors={['#FF6A00', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <MHeader title="Profil" transparent />
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar}>
            <MAvatar
              name={profile?.firstName ?? 'P'}
              uri={profile?.avatarUrl}
              size="xl"
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={wp(14)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {(() => {
            const roleName = profile?.role?.toLowerCase?.() ??
              profile?.roles?.[0]?.name?.toLowerCase?.() ?? '';
            return roleName ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {roleName === 'partner' ? 'Partenaire' : 'Opérateur'}
                </Text>
              </View>
            ) : null;
          })()}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Edit form */}
        <MCard style={styles.formCard} elevation="sm">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editBtn}>
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

          {isEditing ? (
            <MButton
              title="Enregistrer"
              onPress={handleSubmit((data) => updateMutation.mutate(data))}
              loading={updateMutation.isPending}
              disabled={!isDirty}
              style={{ marginTop: spacing[3] }}
            />
          ) : null}
        </MCard>

        {/* Menu items */}
        <MCard style={styles.menuCard} elevation="sm">
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                <View
                  style={[
                    styles.menuIcon,
                    item.color
                      ? { backgroundColor: `${item.color}15` }
                      : undefined,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={wp(20)}
                    color={item.color ?? colors.violet[500]}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.color ? { color: item.color } : undefined,
                  ]}
                >
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={wp(18)}
                  color={colors.neutral[300]}
                />
              </TouchableOpacity>
              {idx < menuItems.length - 1 ? <MDivider /> : null}
            </React.Fragment>
          ))}
        </MCard>

        {/* Logout */}
        <MButton
          title="Se déconnecter"
          variant="ghost"
          onPress={handleLogout}
          style={styles.logoutBtn}
          icon={<Ionicons name="log-out-outline" size={wp(18)} color={colors.error[500]} />}
        />

        <View style={{ height: wp(100) }} />
      </ScrollView>

      {/* Logout confirmation modal */}
      <MModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Déconnexion"
      >
        <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
          <Ionicons name="log-out-outline" size={wp(48)} color={colors.error[500]} />
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
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: colors.violet[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    ...textStyles.h3,
    color: '#FFFFFF',
    marginTop: spacing[3],
  },
  profileEmail: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[1],
  },
  roleBadge: {
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
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing[4],
  },
  formCard: {
    marginBottom: spacing[4],
    backgroundColor: '#111827',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  cardTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  editBtn: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[600],
  },
  menuCard: {
    marginBottom: spacing[4],
    backgroundColor: '#111827',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  menuIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  menuLabel: {
    ...textStyles.body,
    color: colors.neutral[900],
    flex: 1,
  },
  logoutBtn: {
    marginTop: spacing[2],
  },
});
