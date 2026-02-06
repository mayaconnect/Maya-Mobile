import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { API_BASE_URL, AuthService } from '@/services/auth.service';
import { removeAvatar as removeAvatarApi, uploadAvatar as uploadAvatarApi } from '@/services/auth/auth.profile';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

// Fonction helper pour convertir un Uint8Array en base64 (compatible React Native)
function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = i < binary.length ? binary.charCodeAt(i++) : 0;
    const c = i < binary.length ? binary.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
}

interface ProfileHeaderProps {
  userInfo: any;
  user: any;
  hasSubscription: boolean;
  subscription?: any;
  onRefresh: () => void;
  onAvatarUpdate?: (updatedUser: any) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userInfo,
  user,
  hasSubscription,
  subscription,
  onRefresh,
  onAvatarUpdate,
}) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  // Charger l'avatar au montage et quand userInfo change
  useEffect(() => {
    const loadAvatar = async () => {
      if (userInfo?.avatarBase64) {
        setAvatarBase64(userInfo.avatarBase64);
        return;
      }

      const avatarUrl = (userInfo as any)?.avatarUrl || (userInfo as any)?.avatar;
      if (avatarUrl) {
        const base64 = await loadAvatarWithAuth(avatarUrl);
        if (base64) {
          setAvatarBase64(base64);
        }
      }
    };

    loadAvatar();
  }, [userInfo]);

  // Fonction pour charger l'avatar avec authentification
  const loadAvatarWithAuth = async (avatarUrl: string): Promise<string | null> => {
    try {
      const token = await AuthService.getAccessToken();
      if (!token) {
        console.warn('⚠️ [ProfileHeader] Pas de token pour charger l\'avatar');
        return null;
      }

      const isFullUrl = avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
      
      if (isFullUrl) {
        console.log('📥 [ProfileHeader] Chargement avatar depuis URL complète:', avatarUrl);
        
        try {
          const response = await fetch(avatarUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
            },
          });

          if (response.ok) {
            console.log('✅ [ProfileHeader] Avatar chargé depuis URL complète');
            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            const base64 = arrayBufferToBase64(bytes);
            return base64;
          } else {
            console.log(`⚠️ [ProfileHeader] URL complète avec token retourne ${response.status}, essai sans token...`);
            const responseWithoutToken = await fetch(avatarUrl, {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            });

            if (responseWithoutToken.ok) {
              console.log('✅ [ProfileHeader] Avatar chargé depuis URL complète (sans token)');
              const arrayBuffer = await responseWithoutToken.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const base64 = arrayBufferToBase64(bytes);
              return base64;
            } else {
              console.warn(`⚠️ [ProfileHeader] Impossible de charger l'avatar depuis l'URL complète: ${responseWithoutToken.status}`);
              return await tryProxyEndpoint(avatarUrl, token);
            }
          }
        } catch (fetchError) {
          console.error('❌ [ProfileHeader] Erreur lors du chargement depuis URL complète:', fetchError);
          return await tryProxyEndpoint(avatarUrl, token);
        }
      } else {
        if (!API_BASE_URL) {
          console.warn('⚠️ [ProfileHeader] API_BASE_URL non défini');
          return null;
        }
        const urlObj = new URL(API_BASE_URL);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        
        const cleanAvatarPath = avatarUrl.replace(/^\/+/, '');
        const filename = cleanAvatarPath.split('/').pop() || '';
        
        const possibleUrls: string[] = [];
        
        if (filename) {
          possibleUrls.push(`${API_BASE_URL}/auth/avatar`);
          possibleUrls.push(`${API_BASE_URL}/users/me/avatar`);
        }
        
        if (avatarUrl.startsWith('/')) {
          possibleUrls.push(`${baseUrl}${avatarUrl}`);
        } else {
          possibleUrls.push(`${baseUrl}/${cleanAvatarPath}`);
        }
        possibleUrls.push(`${baseUrl}/api/v1/${cleanAvatarPath}`);

        console.log('📥 [ProfileHeader] Tentative de chargement avatar, URLs à tester:', possibleUrls);

        for (const url of possibleUrls) {
          try {
            console.log(`🔍 [ProfileHeader] Test de l'URL: ${url}`);
            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
              },
            });

            if (response.ok) {
              console.log(`✅ [ProfileHeader] Avatar trouvé à l'URL: ${url}`);
              const arrayBuffer = await response.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const base64 = arrayBufferToBase64(bytes);
              return base64;
            } else {
              console.log(`⚠️ [ProfileHeader] URL ${url} retourne ${response.status}`);
            }
          } catch (fetchError) {
            console.log(`⚠️ [ProfileHeader] Erreur pour l'URL ${url}:`, fetchError);
            continue;
          }
        }

        console.warn('⚠️ [ProfileHeader] Aucune URL valide trouvée pour l\'avatar.');
        return null;
      }
    } catch (error) {
      console.error('❌ [ProfileHeader] Erreur lors du chargement avatar avec auth:', error);
      return null;
    }
  };

  // Fonction helper pour essayer un endpoint proxy du backend
  const tryProxyEndpoint = async (avatarUrl: string, token: string): Promise<string | null> => {
    try {
      const proxyUrl = `${API_BASE_URL}/auth/avatar-proxy?url=${encodeURIComponent(avatarUrl)}`;
      console.log('🔄 [ProfileHeader] Essai via endpoint proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        console.log('✅ [ProfileHeader] Avatar chargé via endpoint proxy');
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const base64 = arrayBufferToBase64(bytes);
        return base64;
      } else {
        console.warn(`⚠️ [ProfileHeader] Endpoint proxy retourne ${response.status}`);
        return null;
      }
    } catch (error) {
      console.warn('⚠️ [ProfileHeader] Erreur avec endpoint proxy:', error);
      return null;
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Changer la photo de profil',
      'Choisissez une option',
      [
        {
          text: 'Galerie',
          onPress: () => pickImageFromLibrary(),
        },
        {
          text: 'Caméra',
          onPress: () => takePhotoWithCamera(),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à votre galerie pour sélectionner une photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadAvatarImage(imageUri);
      }
    } catch (error) {
      console.error('❌ [ProfileHeader] Erreur lors de la sélection depuis la galerie:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à votre caméra pour prendre une photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadAvatarImage(imageUri);
      }
    } catch (error) {
      console.error('❌ [ProfileHeader] Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const uploadAvatarImage = async (imageUri: string) => {
    setUploadingAvatar(true);
    try {
      // Étape 1: Supprimer l'ancien avatar s'il existe
      const hasExistingAvatar = !!(userInfo?.avatarBase64 || (userInfo as any)?.avatarUrl || (userInfo as any)?.avatar);
      
      if (hasExistingAvatar) {
        console.log('🗑️ [ProfileHeader] Suppression de l\'ancien avatar...');
        try {
          await removeAvatarApi();
          console.log('✅ [ProfileHeader] Ancien avatar supprimé');
          setAvatarBase64(null);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (removeError) {
          console.warn('⚠️ [ProfileHeader] Erreur lors de la suppression de l\'ancien avatar (on continue):', removeError);
        }
      }
      
      // Étape 2: Uploader le nouvel avatar
      console.log('📤 [ProfileHeader] Upload du nouvel avatar...');
      const updatedUser = await uploadAvatarApi(imageUri);
      
      // Étape 3: Mettre à jour immédiatement avec la nouvelle image locale
      try {
        const base64String = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64' as any,
        });
        setAvatarBase64(base64String);
        console.log('✅ [ProfileHeader] Nouvel avatar affiché immédiatement depuis l\'image locale');
      } catch (localImageError) {
        console.warn('⚠️ [ProfileHeader] Impossible de charger l\'image locale en base64:', localImageError);
      }
      
      // Étape 4: Recharger les informations utilisateur complètes depuis l'API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const freshUserInfo = await AuthService.getCurrentUserInfo();
      
      console.log('📸 [ProfileHeader] Données utilisateur après upload:', {
        hasAvatarBase64: !!freshUserInfo?.avatarBase64,
        hasAvatarUrl: !!(freshUserInfo as any)?.avatarUrl,
        hasAvatar: !!(freshUserInfo as any)?.avatar,
      });
      
      // Étape 5: Mettre à jour l'avatar depuis la réponse API si disponible
      if (freshUserInfo.avatarBase64) {
        setAvatarBase64(freshUserInfo.avatarBase64);
        console.log('✅ [ProfileHeader] Avatar base64 mis à jour depuis l\'API');
      } else if ((freshUserInfo as any)?.avatarUrl || (freshUserInfo as any)?.avatar) {
        const avatarUrl = (freshUserInfo as any)?.avatarUrl || (freshUserInfo as any)?.avatar;
        console.log('🔄 [ProfileHeader] Rechargement avatar depuis nouvelle URL après upload:', avatarUrl);
        const base64 = await loadAvatarWithAuth(avatarUrl);
        if (base64) {
          setAvatarBase64(base64);
          console.log('✅ [ProfileHeader] Nouvel avatar chargé en base64 depuis l\'URL');
        }
      }
      
      // Notifier le parent de la mise à jour
      if (onAvatarUpdate) {
        onAvatarUpdate(freshUserInfo);
      }
      
      console.log('✅ [ProfileHeader] Avatar uploadé avec succès');
      Alert.alert('Succès', 'Votre photo de profil a été mise à jour');
    } catch (error) {
      console.error('❌ [ProfileHeader] Erreur lors de l\'upload de l\'avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const finalAvatarBase64 = avatarBase64 || userInfo?.avatarBase64;
  const avatarUrl = (userInfo as any)?.avatarUrl || (userInfo as any)?.avatar || '';

  const subscriptionPlanName = subscription?.planCode || subscription?.plan?.name || 'Plan family';
  const isActive = subscription?.isActive || hasSubscription;

  return (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        {/* Avatar centré */}
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={handleAvatarPress}
          disabled={uploadingAvatar}
          activeOpacity={0.7}
        >
          {uploadingAvatar ? (
            <View style={styles.avatarBadge}>
              <ActivityIndicator size="large" color={Colors.text.light} />
            </View>
          ) : finalAvatarBase64 ? (
            <View style={styles.avatarImageContainer}>
              <Image 
                key={`avatar-${avatarUrl ? avatarUrl.split('/').pop() || '' : ''}-${finalAvatarBase64.substring(0, 20)}`}
                source={{ uri: `data:image/jpeg;base64,${finalAvatarBase64}` }}
                style={styles.avatarImage as any}
                resizeMode="cover"
                onError={() => {
                  console.warn('⚠️ [ProfileHeader] Erreur chargement image base64');
                }}
              />
              <View style={styles.avatarEditOverlay}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarInitials}>
                {userInfo ? `${userInfo.firstName?.charAt(0) || ''}${userInfo.lastName?.charAt(0) || ''}`.toUpperCase() : 'U'}
              </Text>
              <View style={styles.avatarEditIcon}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Nom */}
        <Text style={styles.userName}>
          {userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Utilisateur' : 'Utilisateur'}
        </Text>
        
        {/* Email */}
        <Text 
          style={styles.userEmail}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {userInfo?.email || user?.email || 'Non connecté'}
        </Text>
        
        {/* Badges */}
        <View style={styles.badgesRow}>
          {hasSubscription && (
            <View style={[styles.badge, styles.planBadge]}>
              <Text style={styles.badgeText}>{subscriptionPlanName}</Text>
            </View>
          )}
          {isActive && (
            <View style={[styles.badge, styles.activeBadge]}>
              <Text style={styles.badgeText}>Actif</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.sm,
  } as ViewStyle,
  profileHeader: {
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  avatarContainer: {
    position: 'relative',
  } as ViewStyle,
  avatarBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.lg,
    position: 'relative',
  } as ViewStyle,
  avatarImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  } as ViewStyle,
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  } as ViewStyle,
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  } as ViewStyle,
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  } as ViewStyle,
  avatarInitials: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -1,
  } as TextStyle,
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.5,
    marginTop: Spacing.sm,
  } as TextStyle,
  userEmail: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  } as TextStyle,
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  } as ViewStyle,
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  } as ViewStyle,
  planBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  } as ViewStyle,
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  } as ViewStyle,
  badgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontWeight: '700',
  } as TextStyle,
  refreshButton: {
    padding: Spacing.xs,
  } as ViewStyle,
});
