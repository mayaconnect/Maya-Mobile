import { AnimatedButton } from '@/components/common/animated-button';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { QRScanner } from '@/components/qr/qr-scanner';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    const isPartner =
      user?.email?.toLowerCase().includes('partner') ||
      user?.email?.toLowerCase().includes('partenaire') ||
      (user as any)?.role === 'partner' ||
      (user as any)?.isPartner === true;

    if (isPartner) {
      router.replace('/(tabs)/partner-home');
    }
  }, [user]);

  const handleScanPartner = () => {
    setShowQRScanner(true);
  };

  const handleQRScanned = (data: string) => {
    const partnerId = data.split(':').pop() || data;
    Alert.alert(
      '✅ Visite enregistrée',
      `Vous avez scanné le QR code du partenaire ${partnerId}. Votre visite a été enregistrée avec succès !`,
      [{ text: 'Parfait', onPress: () => setShowQRScanner(false) }],
    );
  };

  const heroGreeting = useMemo(() => {
    if (!user?.email) return 'Bonjour ✨';
    const name = user.email.split('@')[0];
    return `Bonjour, ${name} ✨`;
  }, [user?.email]);

  const contentGradient = ['#450A1D', '#120A18'] as const;

  return (
    <NavigationTransition>
      <View style={styles.screen}>
        <LinearGradient colors={contentGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <NeoCard gradient={['#4C0F22', '#1A112A']} style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroTitle}>{heroGreeting}</Text>
                <Text style={styles.heroSubtitle}>Prêt·e à économiser aujourd’hui ?</Text>
              </View>
              <View style={styles.heroSummaryRow}>
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryValue}>47,80 €</Text>
                  <Text style={styles.heroSummaryLabel}>Économies totales</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryValue}>12</Text>
                  <Text style={styles.heroSummaryLabel}>Partenaires visités</Text>
                </View>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.quickActionsCard}>
              <Text style={styles.sectionTitle}>Accès rapide</Text>
              <View style={styles.quickActionsRow}>
                <View style={styles.quickAction}>
                  <View style={[styles.quickIcon, styles.quickIconRose]}>
                    <Ionicons name="scan" size={18} color={Colors.accent.rose} />
                  </View>
                  <Text style={styles.quickLabel}>Scanner</Text>
                </View>
                <View style={styles.quickAction}>
                  <View style={[styles.quickIcon, styles.quickIconCyan]}>
                    <Ionicons name="storefront" size={18} color={Colors.accent.cyan} />
                  </View>
                  <Text style={styles.quickLabel}>Partenaires</Text>
                </View>
                <View style={styles.quickAction}>
                  <View style={[styles.quickIcon, styles.quickIconGold]}>
                    <Ionicons name="card" size={18} color={Colors.accent.gold} />
                  </View>
                  <Text style={styles.quickLabel}>Abonnement</Text>
                </View>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.qrCard}>
              <Text style={styles.qrTitle}>Votre QR Code Maya</Text>
              <Text style={styles.qrSubtitle}>Présentez ce code chez tous nos partenaires</Text>
              <View style={styles.qrWrapper}>
                <View style={styles.qrBackdrop}>
                  <View style={styles.qrGrid}>
                    {Array.from({ length: 49 }, (_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.qrSquare,
                          {
                            backgroundColor:
                              (i % 7 + Math.floor(i / 7)) % 2 === 0 ? Colors.accent.rose : 'rgba(255,255,255,0.9)',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.qrCorner} />
                  <View style={[styles.qrCorner, styles.qrCornerTopRight]} />
                  <View style={[styles.qrCorner, styles.qrCornerBottomLeft]} />
                </View>
              </View>
              <AnimatedButton title="Scanner un partenaire" onPress={handleScanPartner} icon="scan" style={styles.scanButton} variant="solid" />
            </NeoCard>

            <NeoCard variant="glass" style={styles.metricsCard}>
              <Text style={styles.sectionTitle}>Cette semaine</Text>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Ionicons name="trending-up" size={18} color={Colors.secondary[300]} />
                  <Text style={styles.metricValue}>+12%</Text>
                  <Text style={styles.metricLabel}>par rapport à la semaine dernière</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Ionicons name="gift" size={18} color={Colors.accent.gold} />
                  <Text style={styles.metricValue}>3 offres</Text>
                  <Text style={styles.metricLabel}>actives à saisir</Text>
                </View>
              </View>
            </NeoCard>
          </ScrollView>
        </SafeAreaView>

        <QRScanner visible={showQRScanner} onClose={() => setShowQRScanner(false)} onScan={handleQRScanned} />
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  } as ViewStyle,
  heroCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
    gap: Spacing.lg,
  } as ViewStyle,
  heroHeader: {
    gap: Spacing.xs,
  } as ViewStyle,
  heroTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  heroSummaryRow: {
    position: 'relative',
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  heroSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs / 2,
  } as ViewStyle,
  heroSummaryValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroSummaryLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  quickActionsCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  quickIconRose: {
    borderColor: 'rgba(251,76,136,0.3)',
  } as ViewStyle,
  quickIconCyan: {
    borderColor: 'rgba(45,217,255,0.3)',
  } as ViewStyle,
  quickIconGold: {
    borderColor: 'rgba(255,199,86,0.3)',
  } as ViewStyle,
  quickLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  qrCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  qrTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
    textAlign: 'center',
  } as TextStyle,
  qrSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  qrWrapper: {
    alignItems: 'center',
  } as ViewStyle,
  qrBackdrop: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: Spacing.md,
    position: 'relative',
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
    borderRadius: 2,
  } as ViewStyle,
  qrCorner: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.accent.rose,
    borderTopLeftRadius: 6,
  } as ViewStyle,
  qrCornerTopRight: {
    top: 10,
    right: 10,
    left: 'auto',
    borderTopRightRadius: 6,
    borderTopLeftRadius: 0,
  } as ViewStyle,
  qrCornerBottomLeft: {
    bottom: 10,
    top: 'auto',
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 0,
  } as ViewStyle,
  scanButton: {
    marginTop: Spacing.sm,
  } as ViewStyle,
  metricsCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  } as ViewStyle,
  metricItem: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  metricValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  metricLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
  metricDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
});
