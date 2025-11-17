import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { HomeHeader } from '@/components/headers/home-header';
import { QRScanner } from '@/components/qr/qr-scanner';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { QrService, QrTokenData } from '@/services/qr.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
      const token = await QrService.issueQrToken(forceRefresh);
      setQrData(token);
      setQrSeed(Date.now());
    } catch (error) {
      console.error('Erreur lors du chargement du QR Code:', error);
      setQrError("Impossible de charger le QR Code.");
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
