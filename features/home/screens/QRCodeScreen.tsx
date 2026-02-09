import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { QrApi, QrTokenData } from '@/features/home/services/qrApi';
import { SubscriptionsApi } from '@/features/subscription/services/subscriptionsApi';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, ImageStyle, Modal, ScrollView, Share, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeQRCodeCard } from '../components/HomeQRCodeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fonction utilitaire pour convertir ArrayBuffer en Base64
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

export default function QRCodeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [qrData, setQrData] = useState<QrTokenData | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrCodeResponse, setQrCodeResponse] = useState<any | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const previousSubscriptionStatus = useRef<boolean | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Vérifier si l'utilisateur est un partenaire ou un opérateur
  useEffect(() => {
    const isPartner = user?.email?.toLowerCase().includes('partner') || 
                      user?.email?.toLowerCase().includes('partenaire') ||
                      user?.email?.toLowerCase().includes('operator') ||
                      user?.email?.toLowerCase().includes('opérateur') ||
                      (user as any)?.role === 'partner' ||
                      (user as any)?.role === 'operator' ||
                      (user as any)?.role === 'opérateur' ||
                      (user as any)?.role === 'StoreOperator' ||
                      (user as any)?.isPartner === true ||
                      (user as any)?.isOperator === true;
    
    if (isPartner) {
      router.replace('/(tabs)/partner-home');
    }
  }, [user]);

  // Fonction pour charger l'avatar avec authentification
  const loadAvatarWithAuth = useCallback(async (avatarUrl: string) => {
    try {
      const token = await AuthService.getAccessToken();
      if (!token) {
        return null;
      }

      // Si c'est une URL complète (http:// ou https://)
      const isFullUrl = avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
      
      if (isFullUrl) {
        try {
          const response = await fetch(avatarUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true',
            },
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            const base64 = arrayBufferToBase64(bytes);
            return base64;
          } else {
            // Essayer sans token si l'URL contient déjà un SAS token
            const responseWithoutToken = await fetch(avatarUrl, {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            });

            if (responseWithoutToken.ok) {
              const arrayBuffer = await responseWithoutToken.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const base64 = arrayBufferToBase64(bytes);
              return base64;
            }
          }
        } catch (fetchError) {
          console.error('❌ [QRCode] Erreur lors du chargement depuis URL complète:', fetchError);
        }
      }
    } catch (error) {
      console.error('❌ [QRCode] Erreur lors du chargement avatar avec auth:', error);
    }
    return null;
  }, []);

  // Charger l'avatar au montage du composant
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;

      // Si on a déjà le base64, l'utiliser
      if (user.avatarBase64) {
        setAvatarBase64(user.avatarBase64);
        return;
      }

      // Sinon, charger depuis l'URL
      const avatarUrl = (user as any)?.avatarUrl || (user as any)?.avatar;
      if (avatarUrl) {
        const base64 = await loadAvatarWithAuth(avatarUrl);
        if (base64) {
          setAvatarBase64(base64);
        }
      }
    };

    loadAvatar();
  }, [user, loadAvatarWithAuth]);

  // Vérifier si l'utilisateur a une photo de profil
  const hasProfilePhoto = useCallback(() => {
    if (!user) return false;
    const hasAvatar = !!(user.avatarBase64 || (user as any)?.avatarUrl || (user as any)?.avatar);
    return hasAvatar;
  }, [user]);

  // Récupérer l'avatar final
  const finalAvatarBase64 = avatarBase64 || user?.avatarBase64;

  // Charger le QR Code
  const loadQrToken = useCallback(async (forceRefresh: boolean = false) => {
    setQrLoading(true);
    setQrError(null);
    try {
      const qrCode = await QrApi.getCurrentQrCode();
      console.log('✅ [QRCode] QR Code récupéré');
      
      setQrCodeResponse(qrCode);
      
      if (qrCode.token) {
        const token: QrTokenData = {
          token: qrCode.token,
          expiresAt: qrCode.expiresAt,
        };
        setQrData(token);
      } else {
        throw new Error('Token manquant dans la réponse');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du QR Code:', error);
      try {
        const token = await QrApi.issueQrToken(forceRefresh);
        if (token?.token) {
          setQrData(token);
          setQrCodeResponse(null);
        } else {
          throw new Error('Token manquant');
        }
      } catch (fallbackError) {
        console.error('Erreur lors du fallback:', fallbackError);
        setQrError("Impossible de charger le QR Code.");
      }
    } finally {
      setQrLoading(false);
    }
  }, [hasProfilePhoto]);

  // Vérifier l'abonnement actif
  const checkSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    try {
      const hasSub = await SubscriptionsApi.hasActiveSubscription();
      const previousStatus = previousSubscriptionStatus.current;
      setHasActiveSubscription(hasSub);
      previousSubscriptionStatus.current = hasSub;
      
      if (previousStatus === false && hasSub === true) {
        setTimeout(() => {
          loadQrToken(true);
        }, 1000);
      }
    } catch (error) {
      console.error('❌ [QRCode] Erreur lors de la vérification de l\'abonnement:', error);
      setHasActiveSubscription(false);
      previousSubscriptionStatus.current = false;
    } finally {
      setSubscriptionLoading(false);
    }
  }, [loadQrToken]);

  useEffect(() => {
    const checkAuthAndLoadQr = async () => {
      const isAuthenticated = await AuthService.isAuthenticated();
      if (isAuthenticated && !user?.email?.toLowerCase().includes('partner')) {
        await checkSubscription();
        await new Promise(resolve => setTimeout(resolve, 200));
        loadQrToken();
      }
    };
    
    if (user) {
      checkAuthAndLoadQr();
    }
  }, [loadQrToken, checkSubscription, user, hasProfilePhoto]);

  // Rafraîchir le QR Code quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      const refreshOnFocus = async () => {
        if (!user || user?.email?.toLowerCase().includes('partner')) {
          return;
        }

        const hasSub = await SubscriptionsApi.hasActiveSubscription();
        const previousStatus = previousSubscriptionStatus.current;
        
        if (previousStatus === false && hasSub === true) {
          previousSubscriptionStatus.current = hasSub;
          setHasActiveSubscription(hasSub);
          setTimeout(() => {
            loadQrToken(true);
          }, 1000);
        } else if (hasSub !== previousSubscriptionStatus.current) {
          previousSubscriptionStatus.current = hasSub;
          setHasActiveSubscription(hasSub);
        }
      };

      refreshOnFocus();
    }, [user, loadQrToken])
  );

  // Rafraîchir automatiquement le QR code
  useEffect(() => {
    if (!qrData || user?.email?.toLowerCase().includes('partner') || !hasActiveSubscription || !hasProfilePhoto()) {
      return;
    }

    const expiryTime = new Date(qrData.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    if (timeUntilExpiry < 60 * 1000) {
      loadQrToken(true);
      return;
    }

    const timeUntilRefresh = timeUntilExpiry - (60 * 1000);

    const refreshTimer = setTimeout(() => {
      loadQrToken(true);
    }, timeUntilRefresh);

    return () => {
      clearTimeout(refreshTimer);
    };
  }, [qrData, loadQrToken, user, hasActiveSubscription, hasProfilePhoto]);

  const handleReloadQR = useCallback(() => {
    loadQrToken(true);
  }, [loadQrToken]);

  // Générer et partager le QR Code en PDF
  const handleShareQR = useCallback(async () => {
    if (!qrData) {
      Alert.alert('Erreur', 'Aucun QR Code disponible à partager');
      return;
    }

    try {
      const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.token)}&format=png&margin=1`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                margin: 0;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #1F2937;
              }
              .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 100%;
                text-align: center;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                color: #8B2F3F;
                margin-bottom: 10px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #1F2937;
                margin-bottom: 10px;
              }
              .subtitle {
                font-size: 16px;
                color: #6B7280;
                margin-bottom: 30px;
              }
              .qr-container {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 30px 0;
                padding: 20px;
                background: #F9FAFB;
                border-radius: 12px;
              }
              .qr-image {
                width: 300px;
                height: 300px;
                object-fit: contain;
              }
              .token-info {
                margin-top: 30px;
                padding: 20px;
                background: #F3F4F6;
                border-radius: 12px;
                font-size: 12px;
                color: #6B7280;
                word-break: break-all;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #9CA3AF;
              }
              .expiry {
                margin-top: 15px;
                font-size: 14px;
                color: #6B7280;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">✨ Maya</div>
              <div class="title">Mon QR Code Maya</div>
              <div class="subtitle">Présentez ce code chez tous nos partenaires</div>
              
              <div class="qr-container">
                <img src="${qrImageSrc}" alt="QR Code Maya" class="qr-image" />
              </div>
              
              <div class="token-info">
                <strong>Token:</strong><br>
                ${qrData.token}
              </div>
              
              ${qrData.expiresAt ? `
                <div class="expiry">
                  <strong>Expire le:</strong> ${new Date(qrData.expiresAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              ` : ''}
              
              <div class="footer">
                Scannez ce QR Code pour valider votre visite chez un partenaire Maya
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      const shareOptions: any = {
        url: uri,
        mimeType: 'application/pdf',
        title: 'Mon QR Code Maya.pdf',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        console.log('✅ [QRCode] PDF partagé avec succès');
      }

      setTimeout(async () => {
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        } catch (error) {
          console.warn('⚠️ [QRCode] Impossible de supprimer le fichier temporaire:', error);
        }
      }, 60000);

    } catch (error) {
      console.error('❌ [QRCode] Erreur lors de la génération du PDF:', error);
      Alert.alert(
        'Erreur',
        'Impossible de générer le PDF. Voulez-vous partager le token en texte ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Partager le token',
            onPress: async () => {
              try {
                const shareMessage = `Mon QR Code Maya\n\nToken: ${qrData.token}\n\nScannez ce code pour valider ma visite chez un partenaire Maya.`;
                await Share.share({
                  message: shareMessage,
                  title: 'Mon QR Code Maya',
                });
              } catch (shareError) {
                console.error('❌ [QRCode] Erreur lors du partage du token:', shareError);
              }
            },
          },
        ]
      );
    }
  }, [qrData, qrCodeResponse]);

  return (
    <NavigationTransition delay={50}>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, responsiveSpacing(90)) }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header avec titre */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Mon QR Code Maya</Text>
                {/* Image de profil à côté du titre */}
                {finalAvatarBase64 && (
                  <TouchableOpacity
                    style={styles.headerProfileImageContainer}
                    onPress={() => setShowAvatarModal(true)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${finalAvatarBase64}` }}
                      style={styles.headerProfileImage as ImageStyle}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.headerSubtitle}>
                Présentez ce code en caisse pour bénéficier de vos avantages
              </Text>
            </View>

            {/* Carte QR Code */}
            <HomeQRCodeCard
              qrData={qrData}
              qrCodeResponse={qrCodeResponse}
              qrLoading={qrLoading}
              qrError={qrError}
              hasActiveSubscription={hasActiveSubscription}
              subscriptionLoading={subscriptionLoading}
              hasProfilePhoto={hasProfilePhoto()}
              onReload={handleReloadQR}
              onRetry={() => loadQrToken(true)}
              onSubscribe={() => router.push('/subscription')}
              onAddPhoto={() => router.push('/(tabs)/profile')}
            />

            {/* Section d'informations */}
            {qrData && hasActiveSubscription && hasProfilePhoto() && (
              <View style={styles.infoSection}>
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="information-circle" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Comment utiliser votre QR Code ?</Text>
                    <Text style={styles.infoText}>
                      Présentez votre QR Code au partenaire lors de votre passage en caisse. 
                      Il sera scanné pour valider votre visite et appliquer automatiquement vos réductions.
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="time" size={24} color="#10B981" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Validité</Text>
                    <Text style={styles.infoText}>
                      Votre QR Code est valide jusqu'à expiration. Il se renouvelle automatiquement 
                      pour garantir une sécurité optimale.
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="shield-checkmark" size={24} color="#8B2F3F" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Sécurité</Text>
                    <Text style={styles.infoText}>
                      Votre QR Code est unique et sécurisé. Ne le partagez qu'avec les partenaires 
                      Maya lors de vos visites.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal pour afficher l'image en grand */}
          <Modal
            visible={showAvatarModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAvatarModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <TouchableOpacity 
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowAvatarModal(false)}
              >
                <View style={styles.modalContent}>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowAvatarModal(false)}
                  >
                    <Ionicons name="close" size={28} color={Colors.text.light} />
                  </TouchableOpacity>
                  {finalAvatarBase64 && (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${finalAvatarBase64}` }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.modalProfileButton}
                    onPress={() => {
                      setShowAvatarModal(false);
                      router.push('/(tabs)/profile');
                    }}
                  >
                    <Ionicons name="person-circle" size={20} color={Colors.text.light} />
                    <Text style={styles.modalProfileButtonText}>Voir le profil</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
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
  scrollContainer: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  } as ViewStyle,
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  } as ViewStyle,
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    textAlign: 'center',
    letterSpacing: -0.5,
  } as TextStyle,
  headerProfileImageContainer: {
    // Pas de style supplémentaire
  } as ViewStyle,
  headerProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.md,
  } as ImageStyle,
  headerSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
  } as TextStyle,
  infoSection: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  } as ViewStyle,
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.sm,
    gap: Spacing.md,
  } as ViewStyle,
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  infoContent: {
    flex: 1,
  } as ViewStyle,
  infoTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  } as TextStyle,
  modalContainer: {
    flex: 1,
  } as ViewStyle,
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  modalCloseButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  } as ViewStyle,
  modalImage: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    height: SCREEN_WIDTH * 0.9,
    maxHeight: 400,
    borderRadius: BorderRadius.xl,
  } as ImageStyle,
  modalProfileButton: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(139, 47, 63, 0.8)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  modalProfileButtonText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
});

