/**
 * Maya Connect V2 — Partner Profile Screen (redesigned)
 */
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../src/api/auth.api';
import { MAvatar, MButton, MModal } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePartnerStore } from '../../src/stores/partner.store';
import { borderRadius, shadows, spacing } from '../../src/theme/spacing';
import { fontFamily } from '../../src/theme/typography';
import {
  authenticateWithBiometric,
  checkBiometricAvailability,
  clearBiometricCredentials,
  getBiometricType,
  isBiometricLoginEnabled,
  saveBiometricCredentials,
} from '../../src/utils/biometric';
import { wp } from '../../src/utils/responsive';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Section {
  title: string;
  items: {
    icon: IoniconsName;
    label: string;
    sublabel?: string;
    onPress: () => void;
    danger?: boolean;
    accent?: string;
  }[];
}

export default function PartnerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const stores = usePartnerStore((s) => s.stores);
  const partner = usePartnerStore((s) => s.partner);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPassword, setPendingPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height,
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    });
    const hide = Keyboard.addListener('keyboardWillHide', (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: e.duration || 200,
        useNativeDriver: true,
      }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    (async () => {
      const available = await checkBiometricAvailability();
      setBiometricAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
        const enabled = await isBiometricLoginEnabled();
        setBiometricEnabled(enabled);
      }
    })();
  }, []);

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const success = await authenticateWithBiometric(`Activer ${biometricType}`);
      if (!success) return;
      setShowPasswordModal(true);
    } else {
      const success = await authenticateWithBiometric(`Désactiver ${biometricType}`);
      if (!success) return;
      await clearBiometricCredentials();
      setBiometricEnabled(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const confirmBiometricPassword = async () => {
    if (!pendingPassword.trim()) return;
    try {
      setVerifyingPassword(true);
      await authApi.login({ email: user?.email ?? '', password: pendingPassword });
      await saveBiometricCredentials(user?.email ?? '', pendingPassword);
      setBiometricEnabled(true);
      setShowPasswordModal(false);
      setPendingPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        'Mot de passe incorrect. Veuillez réessayer.';
      Alert.alert('Erreur', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const profileQ = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    select: (res) => res.data,
    initialData: { data: user } as any,
  });
  const profile = profileQ.data ?? user;

  const avatarMutation = useMutation({
    mutationFn: async (uri: string) => {
      const form = new FormData();
      form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      return authApi.uploadAvatar(form);
    },
    onSuccess: (res) => {
      setUser({ ...profile, avatarUrl: res.data?.avatarUrl } as any);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const pickAvatar = () => {
    Alert.alert('Photo de profil', 'Choisissez une option', [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const { granted } = await ImagePicker.requestCameraPermissionsAsync();
          if (!granted) return;
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled && result.assets[0]) avatarMutation.mutate(result.assets[0].uri);
        },
      },
      {
        text: 'Choisir depuis la galerie',
        onPress: async () => {
          const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled && result.assets[0]) avatarMutation.mutate(result.assets[0].uri);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      try {
        const SecureStore = await import('expo-secure-store');
        const pushToken = await SecureStore.getItemAsync('expo_push_token');
        if (pushToken) {
          const { pushDeviceApi } = await import('../../src/api/push-device.api');
          pushDeviceApi.unregister({ token: pushToken }).catch(() => {});
          SecureStore.deleteItemAsync('expo_push_token').catch(() => {});
        }
      } catch {}
      queryClient.cancelQueries();
      queryClient.clear();
      if (refreshToken) authApi.logout({ refreshToken }).catch(() => {});
      await logout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.replace('/auth/login'), 100);
    } catch {
      await logout().catch(() => {});
      router.replace('/auth/login');
    }
  };

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Partenaire';
  const partnerName = partner?.displayName ?? partner?.legalName ?? null;

  const sections: Section[] = [
    {
      title: 'Mon compte',
      items: [
        {
          icon: 'person-outline',
          label: 'Modifier le profil',
          sublabel: 'Nom, téléphone, adresse',
          onPress: () => router.push('/(partner)/edit-profile' as any),
        },
        {
          icon: 'lock-closed-outline',
          label: 'Changer le mot de passe',
          sublabel: 'Sécurité du compte',
          onPress: () => router.push('/(partner)/change-password' as any),
        },
      ],
    },
    {
      title: 'Mon équipe',
      items: [
        {
          icon: 'people-outline',
          label: 'Gérer les opérateurs',
          sublabel: 'Inviter et gérer votre équipe',
          onPress: () => router.push('/(partner)/team' as any),
          accent: '#6366F1',
        },
      ],
    },
    {
      title: 'Activité',
      items: [
        {
          icon: 'time-outline',
          label: 'Historique',
          sublabel: 'Transactions et activités',
          onPress: () => router.push('/(partner)/history' as any),
          accent: '#34D399',
        },
      ],
    },
    {
      title: 'Session',
      items: [
        {
          icon: 'log-out-outline',
          label: 'Se déconnecter',
          onPress: () => setShowLogoutModal(true),
          danger: true,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ── Hero header ── */}
        <LinearGradient
          colors={['#0D0E20', '#1a1b3e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing[3] }]}
        >
          {/* Avatar */}
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap} activeOpacity={0.85}>
            <View style={styles.avatarBorder}>
              <MAvatar
                uri={profile?.avatarUrl}
                name={fullName}
                size="lg"
              />
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={wp(13)} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{fullName}</Text>
          {partnerName && <Text style={styles.heroPartner}>{partnerName}</Text>}
          <Text style={styles.heroEmail}>{profile?.email}</Text>

       
        </LinearGradient>

        {/* ── Content below header ── */}
        <View style={styles.content}>
          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="mail-outline" size={wp(16)} color="#6366F1" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email ?? '—'}</Text>
              </View>
            </View>
            {profile?.phoneNumber ? (
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="call-outline" size={wp(16)} color="#6366F1" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{profile.phoneNumber}</Text>
                </View>
              </View>
            ) : null}
            {profile?.address?.city ? (
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="location-outline" size={wp(16)} color="#6366F1" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ville</Text>
                  <Text style={styles.infoValue}>
                    {[profile.address.city, profile.address.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Biometric section */}
          {biometricAvailable ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sécurité</Text>
              <View style={styles.sectionCard}>
                <View style={styles.biometricRow}>
                  <View style={styles.biometricLeft}>
                    <View style={styles.itemIcon}>
                      <Ionicons
                        name={biometricType.includes('Face') ? 'scan-outline' : 'finger-print-outline'}
                        size={wp(20)}
                        color="#6366F1"
                      />
                    </View>
                    <View style={styles.biometricInfo}>
                      <Text style={styles.itemLabel}>{biometricType}</Text>
                      <Text style={styles.itemSublabel}>
                        Se connecter avec {biometricType.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={toggleBiometric}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(99,102,241,0.4)' }}
                    thumbColor={biometricEnabled ? '#6366F1' : 'rgba(255,255,255,0.4)'}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* Menu sections */}
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, idx) => (
                  <React.Fragment key={item.label}>
                    {idx > 0 && <View style={styles.itemDivider} />}
                    <TouchableOpacity
                      style={styles.item}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.itemIcon,
                        item.danger && styles.itemIconDanger,
                        item.accent && { backgroundColor: `${item.accent}18` },
                      ]}>
                        <Ionicons
                          name={item.icon}
                          size={wp(20)}
                          color={item.danger ? '#EF4444' : item.accent ?? '#6366F1'}
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={[styles.itemLabel, item.danger && styles.itemLabelDanger]}>
                          {item.label}
                        </Text>
                        {item.sublabel && (
                          <Text style={styles.itemSublabel}>{item.sublabel}</Text>
                        )}
                      </View>
                      <View style={styles.itemChevron}>
                        <Ionicons
                          name="chevron-forward"
                          size={wp(14)}
                          color={item.danger ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}
                        />
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Logout modal */}
      <MModal visible={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Déconnexion">
        <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={wp(32)} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>
            Êtes-vous sûr de vouloir vous déconnecter ?
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}>
          <MButton title="Annuler" variant="outline" onPress={() => setShowLogoutModal(false)} style={{ flex: 1 }} />
          <MButton title="Déconnecter" variant="danger" onPress={confirmLogout} style={{ flex: 1 }} />
        </View>
      </MModal>

      {/* Biometric Password Modal */}
      <MModal
        visible={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPendingPassword(''); }}
        title={`Activer ${biometricType}`}
      >
        <Animated.View style={{ transform: [{ translateY: Animated.multiply(keyboardOffset, -1) }] }}>
          <View style={{ alignItems: 'center', paddingTop: spacing[4] }}>
            <Ionicons
              name={biometricType.includes('Face') ? 'scan-outline' : 'finger-print-outline'}
              size={wp(48)}
              color="#6366F1"
            />
            <Text style={styles.biometricModalText}>
              Entrez votre mot de passe pour associer {biometricType.toLowerCase()} à votre compte.
            </Text>
            <TextInput
              ref={passwordInputRef}
              value={pendingPassword}
              onChangeText={setPendingPassword}
              secureTextEntry
              placeholder="Mot de passe"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus
              style={styles.biometricPasswordInput}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}>
            <MButton
              title="Annuler"
              variant="outline"
              onPress={() => { setShowPasswordModal(false); setPendingPassword(''); }}
              style={{ flex: 1 }}
            />
            <MButton
              title="Confirmer"
              onPress={confirmBiometricPassword}
              loading={verifyingPassword}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </MModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  /* ── Hero ── */
  hero: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    alignItems: 'center',
    borderBottomLeftRadius: wp(24),
    borderBottomRightRadius: wp(24),
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing[3],
    marginTop: 0,
  },
  avatarBorder: {
    borderWidth: 3,
    borderColor: 'rgba(99,102,241,0.5)',
    borderRadius: borderRadius.full,
    padding: 2,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  heroName: {
    fontSize: wp(19),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  heroPartner: {
    fontSize: wp(12),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
    textAlign: 'center',
  },
  heroEmail: {
    fontSize: wp(11),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
    textAlign: 'center',
    marginBottom: spacing[3],
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    gap: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  statValue: {
    fontSize: wp(18),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: wp(10),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: wp(28),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  rolePillText: {
    fontSize: wp(11),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },

  /* ── Content area below header ── */
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    gap: spacing[4],
  },

  /* ── Info card ── */
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    ...shadows.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  infoIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: wp(10),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: wp(14),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.85)',
  },

  /* ── Sections ── */
  section: {},
  sectionTitle: {
    fontSize: wp(11),
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing[4],
  },
  itemIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemIconDanger: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  itemContent: { flex: 1 },
  itemLabel: {
    fontSize: wp(14),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  itemLabelDanger: {
    color: '#EF4444',
  },
  itemSublabel: {
    fontSize: wp(11),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  itemChevron: {
    width: wp(28),
    height: wp(28),
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Biometric */
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  biometricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  biometricInfo: {
    flex: 1,
  },

  /* Biometric modal */
  biometricModalText: {
    fontSize: wp(13),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[4],
  },
  biometricPasswordInput: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.5)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#1E293B',
  },

  /* Logout modal */
  logoutIcon: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: wp(14),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: spacing[3],
  },
});
