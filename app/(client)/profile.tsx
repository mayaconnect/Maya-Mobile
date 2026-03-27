/**
 * Maya Connect V2 — Profile Screen (Client)
 *
 * Full profile with:
 *  • Avatar upload
 *  • Personal data editing (name, phone, birth date)
 *  • Address editing
 *  • Payment method display
 *  • Biometric (FaceID / fingerprint) toggle
 *  • Account menu (subscription, history, map)
 *  • Logout
 */
import { Ionicons } from '@expo/vector-icons';
import {
  authenticateWithBiometric,
  checkBiometricAvailability,
  clearBiometricCredentials,
  getBiometricType,
  isBiometricLoginEnabled,
  saveBiometricCredentials,
} from '../../src/utils/biometric';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppAlert } from '../../src/hooks/use-app-alert';
import { authApi } from '../../src/api/auth.api';
import {
    MAvatar,
    MBadge,
    MButton,
    MDivider,
    MModal,
} from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { clientColors as colors } from '../../src/theme/colors';
import { borderRadius, spacing } from '../../src/theme/spacing';
import { fontFamily, textStyles, textStyles as themeTextStyles } from '../../src/theme/typography';
import { formatDate, formatName } from '../../src/utils/format';
import { wp } from '../../src/utils/responsive';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, setUser, logout: doLogout } = useAuthStore();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const { alert, AlertModal } = useAppAlert();
  const [uploading, setUploading] = useState(false);
  const [showAvatarZoom, setShowAvatarZoom] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPassword, setPendingPassword] = useState('');
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
      // Ask for password to save credentials
      setShowPasswordModal(true);
    } else {
      const success = await authenticateWithBiometric(`Désactiver ${biometricType}`);
      if (!success) return;
      await clearBiometricCredentials();
      setBiometricEnabled(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const confirmBiometricPassword = async () => {
    if (!pendingPassword.trim()) return;
    try {
      setVerifyingPassword(true);
      // Vérifier que le mot de passe est correct avant de le sauvegarder
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
      alert('Mot de passe incorrect', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setVerifyingPassword(false);
    }
  };

  /* ── Avatar upload ── */
  const uploadAvatarAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      const formData = new FormData();
      const ext = asset.uri.split('.').pop() || 'jpg';
      const mime = asset.mimeType || `image/${ext === 'png' ? 'png' : 'jpeg'}`;
      formData.append('file', {
        uri: Platform.OS === 'web' ? asset.uri : asset.uri.replace('file://', ''),
        name: asset.fileName || `avatar.${ext}`,
        type: mime,
      } as any);
      await authApi.uploadAvatar(formData);
      const res = await authApi.getProfile();
      setUser(res.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      alert('Erreur', "Impossible de mettre à jour votre photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarPick = () => {
    Alert.alert(
      'Photo de profil',
      '',
      [
        {
          text: 'Prendre une photo',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              alert('Permission requise', "L'accès à la caméra est nécessaire.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await uploadAvatarAsset(result.assets[0]);
            }
          },
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              alert('Permission requise', "L'accès à la galerie est nécessaire.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await uploadAvatarAsset(result.assets[0]);
            }
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  /* ── Logout ── */
  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      // Clear react-query cache FIRST to stop any in-flight queries  
      queryClient.cancelQueries();
      queryClient.clear();
      // Try to inform server (fire-and-forget)
      if (refreshToken) {
        authApi.logout({ refreshToken }).catch(() => {});
      }
      // Clear local state + storage
      await doLogout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigate after state is clean
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
    } catch {
      // Ensure logout completes even if something fails
      await doLogout().catch(() => {});
      router.replace('/auth/login');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + wp(100) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar + Name ── */}
      <View style={styles.avatarSection}>
        <View>
          <TouchableOpacity
            onPress={() => user?.avatarUrl ? setShowAvatarZoom(true) : handleAvatarPick()}
            disabled={uploading}
          >
            <MAvatar
              uri={user?.avatarUrl}
              name={formatName(user?.firstName, user?.lastName)}
              size="xl"
            />
          </TouchableOpacity>
          {/* Camera badge — always visible for avatar change */}
          <TouchableOpacity
            style={styles.cameraBadge}
            onPress={handleAvatarPick}
            disabled={uploading}
          >
            <Ionicons name="camera" size={wp(16)} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.displayName}>
          {formatName(user?.firstName, user?.lastName)}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <MBadge
          label={user?.role || user?.roles?.[0]?.name || 'Client'}
          variant="orange"
          size="md"
          style={{ marginTop: spacing[2] }}
        />
        {user?.birthDate ? (
          <Text style={styles.birthDate}>
            Né(e) le {formatDate(user.birthDate)}
          </Text>
        ) : null}
      </View>



      {/* ── Personal Information ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mon profil</Text>
          <TouchableOpacity
            onPress={() => router.push('/(client)/edit-profile' as any)}
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={wp(16)} color={colors.orange[500]} />
            <Text style={styles.editLink}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={wp(16)} color={colors.orange[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.previewLabel}>Email</Text>
              <Text style={styles.previewValue}>{user?.email}</Text>
            </View>
          </View>

          {user?.phoneNumber ? (
            <>
              <View style={styles.infoSeparator} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="call-outline" size={wp(16)} color={colors.orange[500]} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.previewLabel}>Téléphone</Text>
                  <Text style={styles.previewValue}>{user.phoneNumber}</Text>
                </View>
              </View>
            </>
          ) : null}

          {user?.address?.city ? (
            <>
              <View style={styles.infoSeparator} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={wp(16)} color={colors.orange[500]} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.previewLabel}>Ville</Text>
                  <Text style={styles.previewValue}>
                    {user.address.city}{user.address.country ? `, ${user.address.country}` : ''}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <MDivider />

      {/* ── Payment & Security ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paiement & Sécurité</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(client)/payment-methods' as any)}
        >
          <Ionicons name="card-outline" size={wp(22)} color={colors.orange[500]} />
          <Text style={styles.menuLabel}>Moyens de paiement</Text>
          <Ionicons
            name="chevron-forward"
            size={wp(18)}
            color={colors.neutral[300]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(client)/invoices' as any)}
        >
          <Ionicons name="receipt-outline" size={wp(22)} color={colors.orange[500]} />
          <Text style={styles.menuLabel}>Mes factures</Text>
          <Ionicons
            name="chevron-forward"
            size={wp(18)}
            color={colors.neutral[300]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(client)/change-password' as any)}
        >
          <Ionicons name="lock-closed-outline" size={wp(22)} color={colors.orange[500]} />
          <Text style={styles.menuLabel}>Changer le mot de passe</Text>
          <Ionicons
            name="chevron-forward"
            size={wp(18)}
            color={colors.neutral[300]}
          />
        </TouchableOpacity>

        {biometricAvailable ? (
          <View style={styles.biometricRow}>
            <View style={styles.biometricLeft}>
              <Ionicons
                name={
                  biometricType.includes('Face')
                    ? 'scan-outline'
                    : 'finger-print-outline'
                }
                size={wp(22)}
                color={colors.orange[500]}
              />
              <View style={styles.biometricInfo}>
                <Text style={styles.biometricLabel}>{biometricType}</Text>
                <Text style={styles.biometricDesc}>
                  Se connecter avec {biometricType.toLowerCase()}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{
                false: colors.neutral[200],
                true: colors.orange[200],
              }}
              thumbColor={
                biometricEnabled ? colors.orange[500] : colors.neutral[400]
              }
            />
          </View>
        ) : null}
      </View>

      <MDivider />

      {/* ── Account menu ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon compte</Text>

        {[
          {
            icon: 'diamond-outline' as const,
            label: 'Mon abonnement',
            onPress: () => router.push('/(client)/subscription'),
          },
          {
            icon: 'pricetag-outline' as const,
            label: 'Mes codes promo',
            onPress: () => router.push('/(client)/promo-codes' as any),
          },
          {
            icon: 'time-outline' as const,
            label: 'Historique des transactions',
            onPress: () => router.push('/(client)/history'),
          },
          {
            icon: 'map-outline' as const,
            label: 'Carte des magasins',
            onPress: () => router.push('/(client)/stores-map'),
          },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={wp(22)} color={colors.orange[500]} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={wp(18)}
              color={colors.neutral[300]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <MDivider />

      {/* ── Logout ── */}
      <View style={styles.section}>
        <MButton
          title="Se déconnecter"
          onPress={handleLogout}
          variant="outline"
          icon={
            <Ionicons
              name="log-out-outline"
              size={wp(18)}
              color={colors.orange[500]}
            />
          }
        />
      </View>

      {/* ── Avatar Zoom Modal ── */}
      <Modal
        visible={showAvatarZoom}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarZoom(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.avatarOverlay} onPress={() => setShowAvatarZoom(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Image
              source={{ uri: user?.avatarUrl }}
              style={styles.avatarZoomImage}
              resizeMode="cover"
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Biometric Password Modal ── */}
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
            color={colors.orange[500]}
          />
          <Text style={[themeTextStyles.body, { textAlign: 'center', marginTop: spacing[3], marginBottom: spacing[4], color: colors.neutral[600] }]}>
            Entrez votre mot de passe pour associer {biometricType.toLowerCase()} à votre compte.
          </Text>
          <TextInput
            ref={passwordInputRef}
            value={pendingPassword}
            onChangeText={setPendingPassword}
            secureTextEntry
            placeholder="Mot de passe"
            placeholderTextColor={colors.neutral[400]}
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

      {/* ── Logout Confirmation Modal ── */}
      <MModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Déconnexion"
      >
        <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
          <Ionicons name="log-out-outline" size={wp(48)} color={colors.error[500]} />
          <Text style={[themeTextStyles.body, { textAlign: 'center', marginTop: spacing[3], color: colors.neutral[600] }]}>
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

      <AlertModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: {
    paddingHorizontal: spacing[6],
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarZoomImage: {
    width: wp(300),
    height: wp(300),
    borderRadius: wp(150),
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  displayName: {
    ...textStyles.h3,
    color: colors.neutral[900],
    marginTop: spacing[3],
  },
  email: {
    ...textStyles.body,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  birthDate: {
    ...textStyles.caption,
    color: colors.neutral[400],
    marginTop: spacing[2],
  },

  /* Section */
  section: {
    marginVertical: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...textStyles.h5,
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  editLink: {
    ...textStyles.caption,
    color: colors.orange[500],
    fontFamily: fontFamily.semiBold,
    marginLeft: 2,
  },

  /* Layout helpers */
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfField: {
    flex: 1,
  },

  /* Menu */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  menuLabel: {
    ...textStyles.body,
    color: colors.neutral[800],
    marginLeft: spacing[3],
    flex: 1,
  },

  /* Biometric */
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  biometricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  biometricInfo: {
    marginLeft: spacing[3],
    flex: 1,
  },
  biometricLabel: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[800],
  },
  biometricDesc: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  biometricPasswordInput: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.orange[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  /* Info Card */
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  infoIconBox: {
    width: wp(34),
    height: wp(34),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: spacing[4] + wp(34) + spacing[3],
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  previewLabel: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginBottom: 2,
  },
  previewValue: {
    ...textStyles.body,
    color: colors.neutral[900],
    fontFamily: fontFamily.medium,
  },
});
