import { NavigationTransition } from '@/components/common/navigation-transition';
import { DebugUsersViewer } from '@/components/debug-users-viewer';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { SubscriptionsApi } from '@/features/subscription/services/subscriptionsApi';
import { useAuth } from '@/hooks/use-auth';
import { API_BASE_URL, AuthService } from '@/services/auth.service';
import { uploadAvatar as uploadAvatarApi } from '@/services/auth/auth.profile';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [showDebugUsers, setShowDebugUsers] = useState(false);
  const { signOut, user, refreshUser } = useAuth();
  
  // États pour les informations complètes
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  // Fonction pour charger l'avatar avec authentification
  const loadAvatarWithAuth = async (avatarUrl: string) => {
    try {
      const token = await AuthService.getAccessToken();
      if (!token) {
        console.warn('⚠️ [Profile] Pas de token pour charger l\'avatar');
        return null;
      }

      // Construire l'URL complète
      let imageUrl = avatarUrl;
      if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
        // Si avatarUrl commence déjà par /, c'est un chemin absolu depuis la racine du serveur
        // Sinon, c'est un chemin relatif
        
        const urlObj = new URL(API_BASE_URL);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        
        // Si avatarUrl commence par /, on l'utilise tel quel (chemin absolu)
        // Sinon, on enlève les slashes en début et on ajoute un /
        if (avatarUrl.startsWith('/')) {
          // Chemin absolu : /uploads/avatars/...
          imageUrl = `${baseUrl}${avatarUrl}`;
        } else {
          // Chemin relatif : uploads/avatars/... (sans slash initial)
          imageUrl = `${baseUrl}/${avatarUrl}`;
        }
        
        // Nettoyer les doubles slashes (sauf après le protocole http:// ou https://)
        imageUrl = imageUrl.replace(/([^:]\/)\/+/g, '$1');
      }

      console.log('📥 [Profile] Chargement avatar avec auth:', { 
        originalAvatarUrl: avatarUrl,
        baseUrl: API_BASE_URL,
        finalImageUrl: imageUrl,
        imageUrlLength: imageUrl.length,
        startsWithSlash: avatarUrl.startsWith('/'),
        startsWithHttp: avatarUrl.startsWith('http'),
      });

      // Télécharger l'image avec authentification
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ [Profile] Erreur HTTP lors du chargement avatar:', {
          status: response.status,
          statusText: response.statusText,
          url: imageUrl,
          errorText: errorText.substring(0, 200),
        });
        return null;
      }

      // Convertir en base64
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Enlever le préfixe data:image/...;base64,
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ [Profile] Erreur lors du chargement avatar avec auth:', error);
      return null;
    }
  };

  // Charger les informations complètes de l'utilisateur
  useEffect(() => {
    const loadUserInfo = async () => {
      console.log('👤 [Profile] Chargement des informations utilisateur...');
      setLoading(true);
      try {
        // Récupérer les infos complètes depuis l'API
        const info = await AuthService.getCurrentUserInfo();
        console.log('✅ [Profile] Informations utilisateur récupérées:', {
          email: info.email,
          firstName: info.firstName,
          lastName: info.lastName,
          hasAddress: !!info.address,
          hasBirthDate: !!info.birthDate,
          hasAvatarBase64: !!info.avatarBase64,
          hasAvatarUrl: !!(info as any)?.avatarUrl,
          hasAvatar: !!(info as any)?.avatar,
          allKeys: Object.keys(info || {}),
        });
        setUserInfo(info);

        // Charger l'avatar si on a une URL mais pas de base64
        if (!info.avatarBase64 && ((info as any)?.avatarUrl || (info as any)?.avatar)) {
          const avatarUrl = (info as any)?.avatarUrl || (info as any)?.avatar;
          console.log('🔄 [Profile] Chargement avatar depuis URL:', {
            avatarUrl,
            avatarUrlType: typeof avatarUrl,
            avatarUrlLength: avatarUrl?.length,
            startsWithSlash: avatarUrl?.startsWith('/'),
            startsWithHttp: avatarUrl?.startsWith('http'),
          });
          const base64 = await loadAvatarWithAuth(avatarUrl);
          if (base64) {
            setAvatarBase64(base64);
            console.log('✅ [Profile] Avatar chargé en base64, longueur:', base64.length);
          } else {
            console.warn('⚠️ [Profile] Impossible de charger l\'avatar depuis l\'URL');
          }
        } else if (info.avatarBase64) {
          setAvatarBase64(info.avatarBase64);
          console.log('✅ [Profile] Avatar base64 déjà présent dans userInfo');
        }

        // Récupérer l'abonnement actif de l'utilisateur connecté
        setSubscriptionLoading(true);
        try {
          // D'abord vérifier si l'utilisateur a un abonnement
          const hasSub = await SubscriptionsApi.hasActiveSubscription();
          console.log('📦 [Profile] Vérification abonnement:', hasSub);

          if (hasSub) {
            // Si oui, récupérer les détails complets
            const sub = await SubscriptionsApi.getMyActiveSubscription();

            if (sub) {
              console.log('✅ [Profile] Abonnement actif récupéré:', {
                id: sub.id,
                planName: sub.planCode || sub.plan?.name,
                isActive: sub.isActive,
                startDate: sub.startedAt,
                expiresAt: sub.expiresAt,
              });
              setSubscription(sub);
              setHasSubscription(true);
            } else {
              console.log('ℹ️ [Profile] Aucun abonnement actif trouvé');
              setSubscription(null);
              setHasSubscription(false);
            }
          } else {
            console.log('ℹ️ [Profile] Pas d\'abonnement actif');
            setSubscription(null);
            setHasSubscription(false);
          }
        } catch (error) {
          console.warn('⚠️ [Profile] Impossible de récupérer l\'abonnement:', error);
          setSubscription(null);
          setHasSubscription(false);
        } finally {
          setSubscriptionLoading(false);
        }
      } catch (error) {
        console.error('❌ [Profile] Erreur lors du chargement des informations:', error);
        // Utiliser les données de base si l'API échoue
        if (user) {
          setUserInfo(user);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [user]);

  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/connexion/login');
  };

  const handleRefresh = async () => {
    console.log('🔄 [Profile] Actualisation des informations...');
    setLoading(true);
    try {
      await refreshUser();
      const info = await AuthService.getCurrentUserInfo();
      setUserInfo(info);
      console.log('✅ [Profile] Informations actualisées');
    } catch (error) {
      console.error('❌ [Profile] Erreur lors de l\'actualisation:', error);
      Alert.alert('Erreur', 'Impossible d\'actualiser les informations');
    } finally {
      setLoading(false);
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
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à votre galerie pour sélectionner une photo.'
        );
        return;
      }

      // Ouvrir la galerie
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
      console.error('❌ [Profile] Erreur lors de la sélection depuis la galerie:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à votre caméra pour prendre une photo.'
        );
        return;
      }

      // Ouvrir la caméra
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
      console.error('❌ [Profile] Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const uploadAvatarImage = async (imageUri: string) => {
    setUploadingAvatar(true);
    try {
      console.log('📤 [Profile] Upload de l\'avatar...');
      const updatedUser = await uploadAvatarApi(imageUri);
      
      // Attendre un peu pour que l'API mette à jour l'avatar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recharger les informations utilisateur complètes pour avoir l'avatar à jour
      const freshUserInfo = await AuthService.getCurrentUserInfo();
      
      console.log('📸 [Profile] Données utilisateur après upload:', {
        hasAvatarBase64: !!freshUserInfo?.avatarBase64,
        hasAvatarUrl: !!(freshUserInfo as any)?.avatarUrl,
        hasAvatar: !!(freshUserInfo as any)?.avatar,
        userInfoKeys: Object.keys(freshUserInfo || {}),
        fullUserInfo: JSON.stringify(freshUserInfo, null, 2),
      });
      
      setUserInfo(freshUserInfo);
      
      // Rafraîchir aussi le contexte utilisateur
      await refreshUser();
      
      console.log('✅ [Profile] Avatar uploadé avec succès', {
        hasAvatar: !!freshUserInfo?.avatarBase64 || !!(freshUserInfo as any)?.avatarUrl || !!(freshUserInfo as any)?.avatar,
        avatarBase64: !!freshUserInfo?.avatarBase64,
        avatarUrl: !!(freshUserInfo as any)?.avatarUrl,
        avatar: !!(freshUserInfo as any)?.avatar,
      });
      Alert.alert('Succès', 'Votre photo de profil a été mise à jour');
    } catch (error) {
      console.error('❌ [Profile] Erreur lors de l\'upload de l\'avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <NavigationTransition>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.title}>Mon Profil</Text>
                <Text style={styles.subtitle}>Gérez votre compte et préférences</Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={Colors.primary[600]} />
            }
          >
          {loading && !userInfo ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[600]} />
              <Text style={styles.loadingText}>Chargement de votre profil...</Text>
            </View>
          ) : (
            <>
              {/* Carte Profil avec gradient */}
              <LinearGradient
                colors={['rgba(139, 47, 63, 0.3)', 'rgba(139, 47, 63, 0.15)', 'rgba(139, 47, 63, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileCard}
              >
                <View style={styles.profileHeader}>
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
                    ) : (() => {
                      // Utiliser avatarBase64 du state si disponible, sinon celui de userInfo
                      const finalAvatarBase64 = avatarBase64 || userInfo?.avatarBase64;
                      
                      // Vérifier si on a un avatar (base64 ou URL)
                      const hasAvatar = finalAvatarBase64 || (userInfo as any)?.avatarUrl || (userInfo as any)?.avatar;
                      if (!hasAvatar) return null;
                      
                      let imageUri = '';
                      if (finalAvatarBase64) {
                        imageUri = `data:image/jpeg;base64,${finalAvatarBase64}`;
                      } else {
                        // Si pas de base64, essayer l'URL (mais ça ne marchera probablement pas sans auth)
                        const avatarUrl = (userInfo as any)?.avatarUrl || (userInfo as any)?.avatar;
                        if (avatarUrl) {
                          if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
                            imageUri = avatarUrl;
                          } else {
                            // Construire l'URL complète depuis le chemin relatif
                            const urlObj = new URL(API_BASE_URL);
                            const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
                            const cleanAvatarUrl = avatarUrl.replace(/^\/+/, '');
                            imageUri = `${baseUrl}/${cleanAvatarUrl}`.replace(/([^:]\/)\/+/g, '$1');
                          }
                        }
                      }
                      
                      console.log('🖼️ [Profile] Affichage avatar:', {
                        hasAvatarBase64: !!userInfo?.avatarBase64,
                        hasAvatarUrl: !!(userInfo as any)?.avatarUrl,
                        hasAvatar: !!(userInfo as any)?.avatar,
                        imageUri: imageUri.length > 100 ? imageUri.substring(0, 100) + '...' : imageUri,
                        fullImageUri: imageUri,
                      });
                      
                      return (
                        <View style={styles.avatarImageContainer}>
                          <Image 
                            source={{ 
                              uri: imageUri,
                              cache: 'default',
                              headers: {
                                // Ajouter les headers nécessaires pour ngrok si besoin
                                'ngrok-skip-browser-warning': 'true',
                              },
                            }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                            onError={(error) => {
                              console.error('❌ [Profile] Erreur chargement image:', {
                                error: error.nativeEvent?.error || error,
                                imageUri: imageUri,
                                imageUriLength: imageUri.length,
                              });
                            }}
                            onLoad={() => {
                              console.log('✅ [Profile] Image avatar chargée avec succès', { imageUri });
                            }}
                            onLoadStart={() => {
                              console.log('🔄 [Profile] Début du chargement de l\'image', { imageUri });
                            }}
                          />
                          <View style={styles.avatarEditOverlay}>
                            <Ionicons name="camera" size={20} color={Colors.text.light} />
                          </View>
                        </View>
                      );
                    })() || (
                      <LinearGradient
                        colors={['#8B2F3F', '#A53F51']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarBadge}
                      >
                        <Text style={styles.avatarInitials}>
                          {userInfo ? `${userInfo.firstName?.charAt(0) || ''}${userInfo.lastName?.charAt(0) || ''}`.toUpperCase() : 'U'}
                        </Text>
                        <View style={styles.avatarEditIcon}>
                          <Ionicons name="camera" size={16} color={Colors.text.light} />
                        </View>
                      </LinearGradient>
                    )}
                    <View style={styles.onlineIndicator} />
                  </TouchableOpacity>
                  <View style={styles.profileInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>
                        {userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Utilisateur' : 'Utilisateur'}
                      </Text>
                      {hasSubscription && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        </View>
                      )}
                    </View>
                    <View style={styles.emailRow}>
                      <Ionicons name="mail" size={14} color={Colors.text.secondary} />
                      <Text style={styles.userEmail}>{userInfo?.email || user?.email || 'Non connecté'}</Text>
                    </View>
                    
                    {/* Informations rapides */}
                    <View style={styles.quickInfoRow}>
                      {userInfo?.birthDate && (
                        <View style={styles.quickInfoTag}>
                          <Ionicons name="calendar" size={12} color="#F6C756" />
                          <Text style={styles.quickInfoText}>
                            {new Date(userInfo.birthDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                      )}
                      {hasSubscription && (
                        <View style={[styles.quickInfoTag, styles.subscriptionTag]}>
                          <Ionicons name="sparkles" size={12} color="#10B981" />
                          <Text style={[styles.quickInfoText, styles.subscriptionTagText]}>Abonné</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh-circle" size={28} color={Colors.primary[400]} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Informations personnelles */}
              {userInfo && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Informations personnelles</Text>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={20} color={Colors.text.secondary} />
                    <View>
                      <Text style={styles.infoLabel}>Nom complet</Text>
                      <Text style={styles.infoValue}>
                        {userInfo.firstName || ''} {userInfo.lastName || ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.infoRow}>
                    <Ionicons name="mail" size={20} color={Colors.text.secondary} />
                    <View>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{userInfo.email || 'N/A'}</Text>
                    </View>
                  </View>

                  {userInfo.birthDate && (
                    <>
                      <View style={styles.separator} />
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color={Colors.text.secondary} />
                        <View>
                          <Text style={styles.infoLabel}>Date de naissance</Text>
                          <Text style={styles.infoValue}>
                            {new Date(userInfo.birthDate).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}

                  {userInfo.address && (
                    <>
                      <View style={styles.separator} />
                      <View style={styles.infoRow}>
                        <Ionicons name="location" size={20} color={Colors.text.secondary} />
                        <View>
                          <Text style={styles.infoLabel}>Adresse</Text>
                          <Text style={styles.infoValue}>
                            {userInfo.address.street && `${userInfo.address.street}\n`}
                            {[userInfo.address.postalCode, userInfo.address.city]
                              .filter(Boolean)
                              .join(' ')}
                            {userInfo.address.country && `\n${userInfo.address.country}`}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}

                  {userInfo.phoneNumber && (
                    <>
                      <View style={styles.separator} />
                      <View style={styles.infoRow}>
                        <Ionicons name="call" size={20} color={Colors.text.secondary} />
                        <View>
                          <Text style={styles.infoLabel}>Téléphone</Text>
                          <Text style={styles.infoValue}>{userInfo.phoneNumber}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Abonnement */}
              {subscriptionLoading ? (
                <View style={styles.sectionCard}>
                  <View style={styles.loadingSection}>
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                    <Text style={styles.loadingSectionText}>Vérification de l'abonnement...</Text>
                  </View>
                </View>
              ) : hasSubscription && subscription ? (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Abonnement</Text>
                    <TouchableOpacity style={styles.ghostButton}>
                      <Text style={styles.ghostButtonText}>Modifier</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.planRow}>
                    <View style={{ flex: 1 } as ViewStyle}>
                      <Text style={styles.planName}>
                        {subscription.planCode || subscription.plan?.name || 'Plan actif'}
                      </Text>
                      <Text style={styles.planDetails}>
                        {subscription.price > 0 ? `${subscription.price}€ / mois` : 'Gratuit'}
                        {subscription.isActive && subscription.personsAllowed ? ` • ${subscription.personsAllowed} ${subscription.personsAllowed > 1 ? 'personnes' : 'personne'}` : ''}
                      </Text>
                      {subscription.startedAt && (
                        <Text style={styles.planDetails}>
                          Actif depuis le {new Date(subscription.startedAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      )}
                      {subscription.expiresAt && subscription.expiresAt !== null ? (
                        <Text style={styles.planDetails}>
                          Expire le {new Date(subscription.expiresAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      ) : subscription.isActive && (
                        <Text style={styles.planDetails}>
                          Renouvelé automatiquement
                        </Text>
                      )}
                    </View>
                    <View style={styles.statusChipActive}>
                      <Text style={styles.statusChipText}>
                        {subscription.isActive ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                  {subscription.isActive && (
                    <TouchableOpacity onPress={() => router.push('/subscription')}>
                      <Text style={styles.cancelLink}>Gérer l&apos;abonnement</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Abonnement</Text>
                  </View>
                  <View style={styles.noSubscriptionContainer}>
                    <Ionicons name="card-outline" size={32} color={Colors.text.secondary} />
                    <Text style={styles.noSubscriptionText}>Aucun abonnement actif</Text>
                    <TouchableOpacity style={styles.subscribeButton}>
                      <Text style={styles.subscribeButtonText} onPress={() => router.push('/subscription')}>S&apos;abonner</Text>
                    </TouchableOpacity> 
                  </View>
                </View>
              )}

              {/* Moyens de paiement */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Moyens de paiement</Text>
                <TouchableOpacity style={styles.paymentItem}>
                  <Ionicons name="card" size={18} color={Colors.text.primary} />
                  <View style={{ flex: 1, marginLeft: Spacing.md } as ViewStyle}>
                    <Text style={styles.paymentTitle}>Visa •••• 4242</Text>
                    <View style={styles.inlineRow}>
                      <View style={styles.defaultChip}><Text style={styles.defaultChipText}>Par défaut</Text></View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.paymentItem}>
                  <Ionicons name="logo-paypal" size={18} color={Colors.text.primary} />
                  <View style={{ flex: 1, marginLeft: Spacing.md } as ViewStyle}>
                    <Text style={styles.paymentTitle}>PayPal</Text>
                    <Text style={styles.paymentSubtitle}>{userInfo?.email || user?.email || 'email@example.com'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>

              {/* Paramètres */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Paramètres</Text>

                <View style={styles.settingRow}>
                  <View style={styles.settingTextCol}>
                    <Text style={styles.settingTitle}>Notifications push</Text>
                    <Text style={styles.settingSubtitle}>Offres et alertes</Text>
                  </View>
                  <Switch value={pushEnabled} onValueChange={setPushEnabled} />
                </View>

                <View style={styles.separator} />

                <View style={styles.settingRow}>
                  <View style={styles.settingTextCol}>
                    <Text style={styles.settingTitle}>Mode sombre</Text>
                    <Text style={styles.settingSubtitle}>Interface sombre</Text>
                  </View>
                  <Switch value={darkMode} onValueChange={setDarkMode} />
                </View>

                <View style={styles.separator} />

                <View style={styles.settingRow}>
                  <View style={styles.settingTextCol}>
                    <Text style={styles.settingTitle}>Face ID</Text>
                    <Text style={styles.settingSubtitle}>Connexion biométrique</Text>
                  </View>
                  <Switch value={faceId} onValueChange={setFaceId} />
                </View>
              </View>

              {/* Liens rapides */}
              <View style={styles.menuSection}>
           

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="download-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Factures et reçus</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="notifications-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Sécurité</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Aide et support</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

           
          </View>

              {/* Déconnexion */}
              <View style={styles.logoutContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} >
                  <Ionicons name="log-out" size={20} color="#EF4444" />
                  <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          </ScrollView>
        </SafeAreaView>

        {/* Modal de debug des utilisateurs */}
        <DebugUsersViewer 
          visible={showDebugUsers} 
          onClose={() => setShowDebugUsers(false)} 
        />
      </LinearGradient>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
    letterSpacing: -1,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['2xl'],
  } as ViewStyle,
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Shadows.xl,
    maxWidth: '100%',
    overflow: 'hidden',
  } as ViewStyle,
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  } as ViewStyle,
  avatarContainer: {
    position: 'relative',
  } as ViewStyle,
  avatarBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.lg,
    position: 'relative',
  } as ViewStyle,
  avatarImageContainer: {
    position: 'relative',
    width: 88,
    height: 88,
  } as ViewStyle,
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  } as ViewStyle,
  avatarEditIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BorderRadius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
  profileInfo: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  verifiedBadge: {
    marginLeft: 4,
  } as ViewStyle,
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  userEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  quickInfoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  quickInfoText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '700',
  } as TextStyle,
  subscriptionTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  } as ViewStyle,
  subscriptionTagText: {
    color: '#10B981',
  } as TextStyle,
  refreshButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  familyChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  familyChipText: {
    color: Colors.secondary[600],
    fontWeight: '600',
  } as TextStyle,
  userMetaText: {
    color: Colors.text.secondary,
  } as TextStyle,
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
    maxWidth: '100%',
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  } as TextStyle,
  ghostButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: Colors.primary[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  ghostButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
  } as TextStyle,
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  planName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  } as TextStyle,
  planDetails: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  statusChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  statusChipText: {
    color: Colors.status.success,
    fontWeight: '600',
  } as TextStyle,
  cancelLink: {
    color: '#ef4444',
    fontWeight: '600',
    marginTop: Spacing.sm,
  } as TextStyle,
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    ...Shadows.xs,
  } as ViewStyle,
  paymentTitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
  } as TextStyle,
  paymentSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  } as ViewStyle,
  defaultChip: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  defaultChipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary[700],
    fontWeight: '600',
  } as TextStyle,
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  } as ViewStyle,
  settingTextCol: {
    flex: 1,
  } as ViewStyle,
  settingTitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  separator: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.sm,
  } as ViewStyle,
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.xs,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    overflow: 'hidden',
  } as ViewStyle,
  logoutContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.sm,
  } as ViewStyle,
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    gap: Spacing.sm,
    ...Shadows.md,
  } as ViewStyle,
  logoutText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: Typography.sizes.base,
    letterSpacing: 0.3,
  } as TextStyle,
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    marginLeft: Spacing.md,
    fontWeight: '600',
  } as TextStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  refreshButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  } as ViewStyle,
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  } as ViewStyle,
  userInfoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
  infoList: {
    gap: Spacing.sm,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    minWidth: 100,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  } as TextStyle,
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  loadingSectionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  noSubscriptionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  } as ViewStyle,
  noSubscriptionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  subscribeButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  } as ViewStyle,
  subscribeButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
});
