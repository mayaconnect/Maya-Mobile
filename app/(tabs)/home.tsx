import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { QrService, QrTokenData } from '@/services/qr.service';
import { TransactionsService } from '@/services/transactions.service';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<QrTokenData | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrCodeResponse, setQrCodeResponse] = useState<any | null>(null);

  // États pour les transactions
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est un partenaire ou un opérateur
  useEffect(() => {
    // Détecter si l'email contient "partner", "operator" ou si l'utilisateur a un rôle partenaire/opérateur
    const isPartner = user?.email?.toLowerCase().includes('partner') || 
                      user?.email?.toLowerCase().includes('partenaire') ||
                      user?.email?.toLowerCase().includes('operator') ||
                      user?.email?.toLowerCase().includes('opérateur') ||
                      (user as any)?.role === 'partner' ||
                      (user as any)?.role === 'operator' ||
                      (user as any)?.role === 'opérateur' ||
                      (user as any)?.isPartner === true ||
                      (user as any)?.isOperator === true;
    
    if (isPartner) {
      // Rediriger vers l'interface partenaire
      router.replace('/(tabs)/partner-home');
    }
  }, [user]);

  // Charger le QR Code côté client
  const loadQrToken = useCallback(async (forceRefresh: boolean = false) => {
    setQrLoading(true);
    setQrError(null);
    try {
      // Récupérer le QR Code complet avec l'image
      const qrCode = await QrService.getCurrentQrCode();
      console.log('✅ [Home] QR Code récupéré:', {
        hasToken: !!qrCode.token,
        hasImage: !!qrCode.imageBase64,
        hasUrl: !!qrCode.qrCodeUrl,
        tokenPreview: qrCode.token ? qrCode.token.substring(0, 30) + '...' : 'undefined',
      });
      
      setQrCodeResponse(qrCode);
      
      // Utiliser le token pour l'affichage
      // IMPORTANT: Ce même token sera utilisé dans l'app ET dans le PDF
      if (qrCode.token) {
        const token: QrTokenData = {
          token: qrCode.token,
          expiresAt: qrCode.expiresAt,
        };
        setQrData(token);
        console.log('🔑 [Home] Token sauvegardé pour affichage et PDF:', token.token.substring(0, 30) + '...');
      } else {
        throw new Error('Token manquant dans la réponse');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du QR Code:', error);
      // Fallback sur issueQrToken si getCurrentQrCode échoue
      try {
        const token = await QrService.issueQrToken(forceRefresh);
        if (token?.token) {
          setQrData(token);
          setQrCodeResponse(null); // Réinitialiser pour forcer l'utilisation du fallback
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
  }, []);

  useEffect(() => {
    const checkAuthAndLoadQr = async () => {
      // Vérifier que l'utilisateur est authentifié avant de charger le QR code
      const isAuthenticated = await AuthService.isAuthenticated();
      if (isAuthenticated && !user?.email?.toLowerCase().includes('partner')) {
        // Petit délai pour s'assurer que le token est bien disponible
        await new Promise(resolve => setTimeout(resolve, 200));
        loadQrToken();
      }
    };
    
    if (user) {
      checkAuthAndLoadQr();
    }
  }, [loadQrToken, user]);

  // Rafraîchir automatiquement le QR code toutes les 5 minutes
  useEffect(() => {
    if (!qrData || user?.email?.toLowerCase().includes('partner')) {
      return;
    }

    const expiryTime = new Date(qrData.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    // Si le token expire dans moins d'1 minute, le rafraîchir immédiatement
    if (timeUntilExpiry < 60 * 1000) {
      console.log('🔄 [Home] Token expirant bientôt, rafraîchissement immédiat...');
      loadQrToken(true);
      return;
    }

    // Calculer le temps jusqu'au rafraîchissement (4 minutes avant expiration)
    const timeUntilRefresh = timeUntilExpiry - (60 * 1000); // 1 minute avant expiration

    console.log('⏰ [Home] Rafraîchissement automatique programmé dans', Math.round(timeUntilRefresh / 1000), 'secondes');

    const refreshTimer = setTimeout(() => {
      console.log('🔄 [Home] Rafraîchissement automatique du QR code...');
      loadQrToken(true);
    }, timeUntilRefresh);

    // Nettoyer le timer si le composant est démonté ou si le QR data change
    return () => {
      clearTimeout(refreshTimer);
    };
  }, [qrData, loadQrToken, user]);

  const handleReloadQR = useCallback(() => {
    loadQrToken(true);
  }, [loadQrToken]);

  // Charger les transactions de l'utilisateur
  const loadUserTransactions = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setTransactionsLoading(true);
      setTransactionsError(null);

      console.log('📊 [Home] Chargement des transactions pour l\'utilisateur:', user.id);

      const response = await TransactionsService.getUserTransactions(user.id, {
        page: 1,
        pageSize: 10, // Limiter à 10 dernières transactions
      });

      console.log('✅ [Home] Transactions reçues:', {
        count: response.items?.length || 0,
        totalCount: response.totalCount,
      });

      setTransactions(response.items || []);
    } catch (err) {
      console.error('❌ [Home] Erreur lors du chargement des transactions:', err);
      let errorMessage = 'Impossible de charger votre historique';

      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Accès refusé.';
        } else {
          errorMessage = err.message;
        }
      }

      setTransactionsError(errorMessage);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user]);

  // Charger les transactions au démarrage
  useEffect(() => {
    if (user && !user.email?.toLowerCase().includes('partner') && !user.email?.toLowerCase().includes('operator')) {
      loadUserTransactions();
    }
  }, [loadUserTransactions, user]);

  // Générer et partager le QR Code en PDF
  const handleShareQR = useCallback(async () => {
    if (!qrData) {
      Alert.alert('Erreur', 'Aucun QR Code disponible à partager');
      return;
    }

    try {
      console.log('📤 [Home] Génération du PDF avec QR Code...');
      console.log('🔑 [Home] Token utilisé pour le PDF:', qrData.token.substring(0, 30) + '...');
      console.log('🔍 [Home] Vérification de la cohérence avec l\'app:', {
        hasImageBase64: !!qrCodeResponse?.imageBase64,
        hasQrCodeUrl: !!qrCodeResponse?.qrCodeUrl,
        tokenMatch: qrData.token === (qrCodeResponse?.token || qrData.token),
      });
      
      // IMPORTANT: Toujours utiliser l'API qrserver.com avec le MÊME TOKEN que l'app
      // Cela garantit que le QR Code PDF est identique au QR Code de l'app
      console.log('🔄 [Home] Génération du QR Code pour le PDF avec le token:', qrData.token.substring(0, 30) + '...');

      const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.token)}&format=png&margin=1`;

      console.log('✅ [Home] URL QR Code générée pour le PDF (identique à l\'app)');
      console.log('🔑 [Home] Token complet:', qrData.token);
      console.log('🌐 [Home] URL complète:', qrImageSrc);

      // Créer le HTML pour le PDF
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

      console.log('📄 [Home] Génération du PDF...');
      
      // Générer le PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log('✅ [Home] PDF généré:', uri);

      // Partager le PDF
      const shareOptions: any = {
        url: uri,
        mimeType: 'application/pdf',
        title: 'Mon QR Code Maya.pdf',
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        console.log('✅ [Home] PDF partagé avec succès');
        if (result.activityType) {
          console.log('📱 [Home] Partagé via:', result.activityType);
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('❌ [Home] Partage annulé');
      }

      // Nettoyer le fichier temporaire après un délai
      setTimeout(async () => {
        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            console.log('🗑️ [Home] Fichier PDF temporaire supprimé');
          }
        } catch (error) {
          console.warn('⚠️ [Home] Impossible de supprimer le fichier temporaire:', error);
        }
      }, 60000); // Supprimer après 1 minute

    } catch (error) {
      console.error('❌ [Home] Erreur lors de la génération du PDF:', error);
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
                console.error('❌ [Home] Erreur lors du partage du token:', shareError);
              }
            },
          },
        ]
      );
    }
  }, [qrData, qrCodeResponse]);



  return (
    <NavigationTransition>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
            {/* Header de bienvenue */}
            <View style={styles.welcomeHeader}>
              <View style={styles.welcomeContent}>
                <View style={styles.welcomeTextContainer}>
                  <Text style={styles.welcomeText}>Bonjour 👋</Text>
                  <Text style={styles.welcomeName}>
                    {user?.firstName || 'Client'} {user?.lastName || ''}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>Profitez de vos avantages Maya</Text>
                </View>
                <TouchableOpacity 
                  style={styles.profileButton}
                  onPress={() => router.push('/(tabs)/profile')}
                >
                  <Ionicons name="person-circle-outline" size={40} color="rgba(255, 255, 255, 0.9)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Statistiques en haut */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, styles.savingsCard]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="wallet" size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>
                  {transactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0).toFixed(2)} €
                </Text>
                <Text style={styles.statLabel}>Économies</Text>
              </View>

              <View style={[styles.statCard, styles.visitsCard]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="checkmark-done" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{transactions.length}</Text>
                <Text style={styles.statLabel}>Visites</Text>
              </View>
            </View>

            {/* Accès rapide */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/partners')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(139, 47, 63, 0.15)' }]}>
                <Ionicons name="storefront" size={26} color="#8B2F3F" />
              </View>
              <Text style={styles.quickActionText}>Partenaires</Text>
              <Text style={styles.quickActionSubtext}>Découvrir les offres</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/subscription')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="card" size={26} color={Colors.accent.gold} />
              </View>
              <Text style={styles.quickActionText}>Abonnement</Text>
              <Text style={styles.quickActionSubtext}>Gérer mon compte</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/history')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="time" size={26} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionText}>Historique</Text>
              <Text style={styles.quickActionSubtext}>Mes transactions</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.qrCard}>
            <View style={styles.qrCardHeader}>
              <View style={styles.qrHeaderLeft}>
                <View style={styles.qrIconBadge}>
                  <Ionicons name="qr-code" size={20} color="#8B2F3F" />
                </View>
                <View>
                  <Text style={styles.qrTitle}>Mon QR Code</Text>
                  <Text style={styles.qrSubtitle}>À présenter en caisse</Text>
                </View>
              </View>
              <View style={styles.qrHeaderActions}>
                <TouchableOpacity 
                  style={styles.qrActionButton}
                  onPress={handleShareQR}
                  disabled={qrLoading || !qrData}
                >
                  <Ionicons 
                    name="share-outline" 
                    size={20} 
                    color={Colors.text.light} 
                    style={(qrLoading || !qrData) && { opacity: 0.5 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.qrReloadButton}
                  onPress={handleReloadQR}
                  disabled={qrLoading}
                >
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color={Colors.text.light} 
                    style={qrLoading && { opacity: 0.5 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.qrContainer}>
              {qrLoading ? (
                <View style={styles.qrLoadingContainer}>
                  <ActivityIndicator size="large" color={Colors.text.light} />
                  <Text style={styles.qrLoadingText}>Génération du QR Code...</Text>
                </View>
              ) : qrError ? (
                <View style={styles.qrErrorContainer}>
                  <Ionicons name="alert-circle" size={32} color={Colors.status.error} />
                  <Text style={styles.qrErrorText}>{qrError}</Text>
                  <TouchableOpacity 
                    style={styles.qrRetryButton}
                    onPress={() => loadQrToken(true)}
                  >
                    <Text style={styles.qrRetryText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              ) : qrData?.token ? (
                <View style={styles.qrCodeWrapper}>
                  <View style={styles.qrCodeContainer}>
                    {/* Priorité 1: Image base64 de l'API */}
                    {qrCodeResponse?.imageBase64 ? (
                      <Image
                        source={{ 
                          uri: qrCodeResponse.imageBase64.startsWith('data:') 
                            ? qrCodeResponse.imageBase64 
                            : `data:image/png;base64,${qrCodeResponse.imageBase64}`
                        }}
                        style={styles.qrCodeImage}
                        resizeMode="contain"
                      />
                    ) : qrCodeResponse?.qrCodeUrl ? (
                      /* Priorité 2: URL du QR Code de l'API */
                      <Image
                        source={{ uri: qrCodeResponse.qrCodeUrl }}
                        style={styles.qrCodeImage}
                        resizeMode="contain"
                      />
                    ) : qrData?.token ? (
                      /* Priorité 3: Génération via API externe à partir du token */
                      <Image
                        source={{
                          uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.token)}&format=png&margin=1`
                        }}
                        style={styles.qrCodeImage}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error('❌ [Home] Erreur lors du chargement du QR Code:', error);
                          console.error('❌ [Home] Token utilisé:', qrData.token.substring(0, 50));
                        }}
                        onLoad={() => {
                          console.log('✅ [Home] QR Code chargé avec succès');
                          console.log('✅ [Home] URL:', `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.token)}`);
                        }}
                      />
                    ) : null}
                  </View>
                  {qrData.expiresAt && (
                    <View style={styles.qrExpiryContainer}>
                      <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                      <Text style={styles.qrExpiryText}>
                        Expire le {new Date(qrData.expiresAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>

          </View>
        </ScrollView>
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
  } as ViewStyle,
  welcomeHeader: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  welcomeTextContainer: {
    flex: 1,
  } as ViewStyle,
  welcomeText: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weights.medium as any,
    marginBottom: 4,
  } as TextStyle,
  welcomeName: {
    fontSize: 32,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    letterSpacing: -0.8,
    marginBottom: 4,
  } as TextStyle,
  welcomeSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  profileButton: {
    padding: 4,
  } as ViewStyle,
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
  } as ViewStyle,
  quickActionIconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  quickActionText: {
    marginTop: 2,
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    textAlign: 'center',
  } as TextStyle,
  quickActionSubtext: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: Typography.weights.medium as any,
    textAlign: 'center',
  } as TextStyle,
  qrCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.xl,
  } as ViewStyle,
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  } as ViewStyle,
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  } as ViewStyle,
  qrIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  qrHeaderActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  } as ViewStyle,
  qrActionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  } as ViewStyle,
  qrReloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  } as ViewStyle,
  qrTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: 2,
    letterSpacing: -0.3,
  } as TextStyle,
  qrSubtitle: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  qrLoadingContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  qrLoadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  qrErrorContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  } as ViewStyle,
  qrErrorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.status.error,
    textAlign: 'center',
  } as TextStyle,
  qrRetryButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  qrRetryText: {
    color: 'white',
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  qrContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  } as ViewStyle,
  qrCodeWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  qrExpiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  } as ViewStyle,
  qrExpiryText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  qrCodeContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    borderWidth: 3,
    borderColor: '#8B2F3F',
    ...Shadows.xl,
    shadowColor: '#8B2F3F',
    shadowOpacity: 0.4,
    elevation: 10,
  } as ViewStyle,
  qrCodeImage: {
    width: 220,
    height: 220,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  qrCode: {
    width: 220,
    height: 220,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.lg,
    alignItems: 'center',
  } as ViewStyle,
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  savingsCard: {},
  visitsCard: {},
  statValue: {
    fontSize: 28,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    marginBottom: 4,
    letterSpacing: -0.5,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.semibold as any,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } as TextStyle,
});
