/**
 * Maya Connect V2 — Store Operator Profile Screen
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../src/api/auth.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePartnerStore } from '../../src/stores/partner.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MButton,
  MCard,
  MAvatar,
  MBadge,
  MDivider,
  MModal,
} from '../../src/components/ui';
import StoreSelectionModal from '../../src/components/partner/StoreSelectionModal';

export default function StoreOperatorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const activeStore = usePartnerStore((s) => s.activeStore);
  const stores = usePartnerStore((s) => s.stores);
  const [showStoreModal, setShowStoreModal] = useState(false);

  // Résoudre le nom du magasin depuis le tableau stores (StoreOperatorDto n'a pas storeName)
  const storeName = useMemo(() => {
    if (!activeStore?.storeId) return null;
    return stores.find((s) => s.id === activeStore.storeId)?.name ?? null;
  }, [activeStore?.storeId, stores]);

  // Check if user is Manager on the active store
  const operatorStores = user?.partnerData?.operatorStores ?? [];
  const activeStoreInfo = operatorStores.find((s) => s.id === activeStore?.storeId);
  const isManager = activeStoreInfo?.isManager ?? false;

  /* ---- Avatar upload ---- */
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const form = new FormData();
        form.append('file', {
          uri: result.assets[0].uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
        await authApi.uploadAvatar(form);
        const res = await authApi.getProfile();
        setUser(res.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert('Erreur', "Impossible de mettre à jour la photo.");
      }
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

  return (
    <View style={styles.container}>
      {/* Header gradient — paddingTop manuel, pas de MHeader interne */}
      <LinearGradient
        colors={['#FF7A18', '#FF9F45']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[3] }]}
      >
        <Text style={styles.headerTitle}>Profil</Text>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
            <MAvatar
              name={user?.firstName ?? 'O'}
              uri={user?.avatarUrl}
              size="md"
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={wp(12)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Opérateur</Text>
            </View>
          </View>
        </View>

      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active store card */}
        <MCard style={styles.storeCard} elevation="md">
          <View style={styles.storeCardHeader}>
            <View style={styles.storeIcon}>
              <Ionicons name="storefront" size={wp(22)} color={colors.violet[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeCardLabel}>Magasin actif</Text>
              <Text style={styles.storeCardName}>
                {storeName ?? 'Aucun magasin sélectionné'}
              </Text>
            </View>
            {storeName ? (
              <MBadge label="Actif" variant="success" size="sm" />
            ) : null}
          </View>

          {stores.length > 1 ? (
            <MButton
              title="Changer de magasin"
              variant="outline"
              size="sm"
              onPress={() => setShowStoreModal(true)}
              style={{ marginTop: spacing[3] }}
              icon={<Ionicons name="swap-horizontal" size={wp(16)} color={colors.orange[500]} />}
            />
          ) : null}

          {isManager && (
            <MButton
              title="Gérer le magasin"
              variant="primary"
              size="sm"
              onPress={() => router.push('/(storeoperator)/store-management' as any)}
              style={{ marginTop: spacing[2] }}
              icon={<Ionicons name="settings-outline" size={wp(16)} color="#FFF" />}
            />
          )}
        </MCard>

        {/* Personal info */}
        <MCard style={styles.infoCard} elevation="sm">
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prénom</Text>
            <Text style={styles.infoValue}>{user?.firstName ?? '—'}</Text>
          </View>
          <MDivider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{user?.lastName ?? '—'}</Text>
          </View>
          <MDivider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
          </View>
          {user?.phoneNumber ? (
            <>
              <MDivider />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
              </View>
            </>
          ) : null}
        </MCard>

        {/* Security */}
        <MCard style={styles.menuCard} elevation="sm">
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(client)/change-password' as any)}
          >
            <Ionicons name="lock-closed-outline" size={wp(20)} color={colors.violet[500]} />
            <Text style={styles.menuLabel}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={wp(18)} color={colors.neutral[300]} />
          </TouchableOpacity>
        </MCard>

        {/* Logout */}
        <MButton
          title="Se déconnecter"
          variant="ghost"
          onPress={() => setShowLogoutModal(true)}
          style={styles.logoutBtn}
          icon={<Ionicons name="log-out-outline" size={wp(18)} color={colors.error[500]} />}
        />

        <View style={{ height: wp(100) }} />
      </ScrollView>

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

      <StoreSelectionModal
        visible={showStoreModal}
        onDismiss={() => setShowStoreModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    borderBottomLeftRadius: wp(32),
    borderBottomRightRadius: wp(32),
    overflow: 'hidden',
  },
  headerTitle: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing[2],
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: colors.violet[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    gap: 2,
  },
  profileName: {
    ...textStyles.h4,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  profileEmail: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  roleBadge: {
    alignSelf: 'center',
    marginTop: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  storeChipText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
    maxWidth: wp(180),
  },
  managerChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing[1],
  },
  managerChipText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingTop: spacing[5] },

  storeCard: { marginBottom: spacing[4] },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: wp(44),
    height: wp(44),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  storeCardLabel: {
    ...textStyles.micro,
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeCardName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    marginTop: spacing[1],
  },

  infoCard: { marginBottom: spacing[4] },
  sectionTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  infoLabel: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },
  infoValue: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[900],
  },

  menuCard: { marginBottom: spacing[4] },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  menuLabel: {
    ...textStyles.body,
    color: colors.neutral[900],
    flex: 1,
    marginLeft: spacing[3],
  },
  logoutBtn: { marginTop: spacing[2] },
});
