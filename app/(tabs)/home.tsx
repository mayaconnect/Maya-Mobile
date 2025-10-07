import { AnimatedButton } from '@/components/animated-button';
import { NavigationTransition } from '@/components/navigation-transition';
import { SharedHeader } from '@/components/shared-header';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const handleScanPartner = () => {
    // Logique pour scanner un partenaire
    console.log('Scanner un partenaire');
  };

  const handlePartnerMode = () => {
    // Logique pour le mode partenaire
    console.log('Mode partenaire');
  };

  return (
    <NavigationTransition>
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <SharedHeader
            title={user ? `Bonjour, ${user.email.split('@')[0]} ✨` : 'Bonjour ✨'}
            subtitle="Prêt•e à économiser aujourd'hui ?"
            onPartnerModePress={handlePartnerMode}
            onSearchPress={() => console.log('Recherche')}
            balanceEuros="47,80 €"
            variant="home"
            gradientColors={['#8B5CF6', '#2563EB'] as const}
            showPartnerMode={false}
          />

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Votre QR Code Maya</Text>
            <Text style={styles.qrSubtitle}>Présentez ce code chez tous nos partenaires</Text>
            
            <View style={styles.qrContainer}>
              <View style={styles.qrCode}>
                {/* QR Code simulé avec design amélioré */}
                <View style={styles.qrGrid}>
                  {Array.from({ length: 49 }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.qrSquare,
                        { 
                          backgroundColor: (i % 7 + Math.floor(i / 7)) % 2 === 0 ? '#8B5CF6' : 'white',
                          borderRadius: 2,
                        }
                      ]}
                    />
                  ))}
                </View>
                {/* Points de détection QR */}
                <View style={styles.qrCorner} />
                <View style={[styles.qrCorner, styles.qrCornerTopRight]} />
                <View style={[styles.qrCorner, styles.qrCornerBottomLeft]} />
              </View>
            </View>

            <AnimatedButton
              title="Scanner un partenaire"
              onPress={handleScanPartner}
              icon="scan"
              style={styles.scanButton}
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
      </SafeAreaView>
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
  qrCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  qrTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  } as TextStyle,
  qrSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
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
