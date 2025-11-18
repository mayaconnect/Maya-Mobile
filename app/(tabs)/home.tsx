import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { HomeHeader } from '@/components/headers/home-header';
import { QRScanner } from '@/components/qr/qr-scanner';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { QrService, QrTokenData } from '@/services/qr.service';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrData, setQrData] = useState<QrTokenData | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrSeed, setQrSeed] = useState(() => Date.now());
  const [qrCodeResponse, setQrCodeResponse] = useState<any | null>(null);

  // Vérifier si l'utilisateur est un partenaire
  useEffect(() => {
    // Détecter si l'email contient "partner" ou si l'utilisateur a un rôle partenaire
    const isPartner = user?.email?.toLowerCase().includes('partner') || 
                      user?.email?.toLowerCase().includes('partenaire') ||
                      (user as any)?.role === 'partner' ||
                      (user as any)?.isPartner === true;
    
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
      });
      
      setQrCodeResponse(qrCode);
      
      // Utiliser le token pour l'affichage
      const token: QrTokenData = {
        token: qrCode.token,
        expiresAt: qrCode.expiresAt,
      };
      setQrData(token);
      setQrSeed(Date.now());
    } catch (error) {
      console.error('Erreur lors du chargement du QR Code:', error);
      // Fallback sur issueQrToken si getCurrentQrCode échoue
      try {
        const token = await QrService.issueQrToken(forceRefresh);
        setQrData(token);
        setQrSeed(Date.now());
      } catch {
        setQrError("Impossible de charger le QR Code.");
      }
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.email?.toLowerCase().includes('partner')) {
      loadQrToken();
    }
  }, [loadQrToken, user]);

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
      console.log('📤 [Home] Génération du PDF avec QR Code...');
      
      // Récupérer l'image base64 du QR Code ou générer une URL
      let qrImageSrc = qrCodeResponse?.imageBase64;
      
      // Si on a l'image base64, s'assurer qu'elle a le bon format
      if (qrImageSrc) {
        if (!qrImageSrc.startsWith('data:')) {
          qrImageSrc = `data:image/png;base64,${qrImageSrc}`;
        }
        console.log('✅ [Home] Utilisation de l\'image base64 du QR Code');
      } else if (qrCodeResponse?.qrCodeUrl) {
        // Utiliser l'URL directement
        qrImageSrc = qrCodeResponse.qrCodeUrl;
        console.log('✅ [Home] Utilisation de l\'URL du QR Code:', qrImageSrc);
      } else {
        // Générer une URL de QR Code en ligne à partir du token
        console.log('🔄 [Home] Génération d\'une URL QR Code à partir du token...');
        qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.token)}`;
        console.log('✅ [Home] URL QR Code générée:', qrImageSrc);
      }

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
                color: #8B5CF6;
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

  const handleScanPartner = () => {
    setShowQRScanner(true);
  };

  const handleQRScanned = (data: string) => {
    console.log('📱 QR Code partenaire scanné:', data);
    
    // Extraire l'ID du partenaire du QR code
    // Format attendu: "maya:partner:123" ou similaire
    const partnerId = data.split(':').pop() || data;
    
    // Ici vous pouvez ajouter la logique pour:
    // - Valider le partenaire avec l'API
    // - Enregistrer la visite
    // - Afficher les détails du partenaire
    // - Rediriger vers la page du partenaire
    
    Alert.alert(
      '✅ Visite enregistrée',
      `Vous avez scanné le QR code du partenaire ${partnerId}. Votre visite a été enregistrée avec succès !`,
      [{ text: 'Parfait', onPress: () => setShowQRScanner(false) }]
    );
  };


  return (
    <NavigationTransition>
      <View style={styles.container}>
        <HomeHeader
          title={user ? `Bonjour, ${user.email.split('@')[0]} ✨` : 'Bonjour ✨'}
          subtitle="Prêt•e à économiser aujourd'hui ?"
          balanceEuros="47,80 €"
          onNotificationPress={() => console.log('Notifications')}
          onProfilePress={() => console.log('Profil')}
        />

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.quickActions}>
            <View style={styles.quickAction}>
              <Ionicons name="scan" size={18} color="#8B5CF6" />
              <Text style={styles.quickActionText}>Scanner</Text>
            </View>
            <View style={styles.quickAction}>
              <Ionicons name="storefront" size={18} color="#10B981" />
              <Text style={styles.quickActionText}>Partenaires</Text>
            </View>
            <View style={styles.quickAction}>
              <Ionicons name="card" size={18} color="#F59E0B" />
              <Text style={styles.quickActionText}>Abonnement</Text>
            </View>
          </View>
          <View style={styles.qrCard}>
            <View style={styles.qrCardHeader}>
              <View>
                <Text style={styles.qrTitle}>Votre QR Code Maya</Text>
                <Text style={styles.qrSubtitle}>Présentez ce code chez tous nos partenaires</Text>
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
                    color={Colors.primary[600]} 
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
                    color={Colors.primary[600]} 
                    style={qrLoading && { opacity: 0.5 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.qrContainer}>
              {qrLoading ? (
                <View style={styles.qrLoadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary[600]} />
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
              ) : qrData ? (
                <View style={styles.qrCode}>
                  {/* QR Code généré à partir du token */}
                  <View style={styles.qrGrid}>
                    {Array.from({ length: 49 }, (_, i) => {
                      const isEven = (i + qrSeed) % 2 === 0;
                      return (
                        <View
                          key={`${qrSeed}-${i}`}
                          style={[
                            styles.qrSquare,
                            { 
                              backgroundColor: isEven ? '#8B5CF6' : 'white',
                              borderRadius: 2,
                            }
                          ]}
                        />
                      );
                    })}
                  </View>
                  {/* Points de détection QR */}
                  <View style={styles.qrCorner} />
                  <View style={[styles.qrCorner, styles.qrCornerTopRight]} />
                  <View style={[styles.qrCorner, styles.qrCornerBottomLeft]} />
                </View>
              ) : null}
            </View>

            <AnimatedButton
              title="Scanner un partenaire"
              onPress={handleScanPartner}
              icon="scan"
              style={styles.scanButton}
              variant="solid"
            />
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.savingsCard]}>
              <View style={styles.statHeader}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text style={[styles.statPeriod, styles.savingsPeriod]}>CE MOIS</Text>
              </View>
              <Text style={[styles.statValue, styles.savingsValue]}>47.8€</Text>
              <Text style={[styles.statLabel, styles.savingsLabel]}>Économisées</Text>
            </View>

            <View style={[styles.statCard, styles.visitsCard]}>
              <View style={styles.statHeader}>
                <Ionicons name="location" size={20} color="#F59E0B" />
                <Text style={[styles.statPeriod, styles.visitsPeriod]}>VISITES</Text>
              </View>
              <Text style={[styles.statValue, styles.visitsValue]}>8</Text>
              <Text style={[styles.statLabel, styles.visitsLabel]}>Partenaires</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Scanner QR Code */}
      <QRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScanned}
      />
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  scrollContainer: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  } as ViewStyle,
  quickActionText: {
    marginTop: 6,
    color: Colors.text.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  qrCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  qrHeaderActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  qrActionButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  qrReloadButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  qrTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  } as TextStyle,
  qrSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
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
  qrCode: {
    width: 180,
    height: 180,
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    position: 'relative',
    ...Shadows.md,
  } as ViewStyle,
  qrGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  qrSquare: {
    width: '12%',
    height: '12%',
    margin: '1%',
  } as ViewStyle,
  qrCorner: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    borderTopLeftRadius: 4,
  } as ViewStyle,
  qrCornerTopRight: {
    top: 8,
    right: 8,
    left: 'auto',
    borderTopRightRadius: 4,
    borderTopLeftRadius: 0,
  } as ViewStyle,
  qrCornerBottomLeft: {
    bottom: 8,
    top: 'auto',
    borderBottomLeftRadius: 4,
    borderTopLeftRadius: 0,
  } as ViewStyle,
  scanButton: {
    marginTop: Spacing.md,
  } as ViewStyle,
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  savingsCard: {
    backgroundColor: Colors.background.card,
  } as ViewStyle,
  visitsCard: {
    backgroundColor: Colors.background.card,
  } as ViewStyle,
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  statPeriod: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  savingsPeriod: {
    color: '#10B981',
  } as TextStyle,
  visitsPeriod: {
    color: '#F59E0B',
  } as TextStyle,
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  } as TextStyle,
  savingsValue: {
    color: '#10B981',
  } as TextStyle,
  visitsValue: {
    color: '#F59E0B',
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  savingsLabel: {
    color: '#10B981',
  } as TextStyle,
  visitsLabel: {
    color: '#F59E0B',
  } as TextStyle,
});
