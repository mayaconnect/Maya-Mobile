import { NavigationTransition } from '@/components/navigation-transition';
import { SharedHeader } from '@/components/shared-header';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionScreen() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'individual' | 'duo' | 'famille' | 'vip'>('duo');

  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };

  return (
    <NavigationTransition>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <SharedHeader
            title="Choisissez votre plan"
            subtitle="Économisez 10% partout avec Maya"
            onPartnerModePress={handlePartnerMode}
            showFamilyBadge={false}
          />

          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Toggle Mensuel/Annuel */}
            <View style={styles.billingToggle}>
              <TouchableOpacity
                style={[styles.toggleOption, billingCycle === 'monthly' && styles.toggleOptionActive]}
                onPress={() => setBillingCycle('monthly')}
              >
                <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
                  Mensuel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, billingCycle === 'annual' && styles.toggleOptionActive]}
                onPress={() => setBillingCycle('annual')}
              >
                <Text style={[styles.toggleText, billingCycle === 'annual' && styles.toggleTextActive]}>
                  Annuel
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-20%</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Plan Individuel */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'individual' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('individual')}
            >
              <View style={styles.planIcon}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.planIconGradient}
                >
                  <Ionicons name="flash" size={24} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Individuel</Text>
                <Text style={styles.planPrice}>
                  {billingCycle === 'monthly' ? '3€ /mois' : '30€ /an'}
                </Text>
                <View style={styles.planFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>QR Code personnel</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>10% de remise partout</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Historique des économies</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Support client</Text>
                  </View>
                </View>
              </View>
              <View style={styles.planSelector}>
                <View style={[styles.radioButton, selectedPlan === 'individual' && styles.radioButtonSelected]}>
                  {selectedPlan === 'individual' && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Plan Duo */}
            <TouchableOpacity
              style={[styles.planCard, styles.planCardPopular, selectedPlan === 'duo' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('duo')}
            >
              <View style={styles.popularBanner}>
                <Ionicons name="star" size={16} color="white" />
                <Text style={styles.popularText}>Le plus populaire</Text>
              </View>
              <View style={styles.planIcon}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.planIconGradient}
                >
                  <Ionicons name="people" size={24} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Duo</Text>
                <Text style={styles.planPrice}>
                  {billingCycle === 'monthly' ? '5€ /mois' : '50€ /an'}
                </Text>
                <View style={styles.planFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>2 QR Codes</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>10% de remise partout</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Historique partagé</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Notifications push</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Support prioritaire</Text>
                  </View>
                </View>
              </View>
              <View style={styles.planSelector}>
                <View style={[styles.radioButton, selectedPlan === 'duo' && styles.radioButtonSelected]}>
                  {selectedPlan === 'duo' && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Plan Famille */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'famille' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('famille')}
            >
              <View style={styles.planIcon}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.planIconGradient}
                >
                  <Ionicons name="people" size={24} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Famille</Text>
                <Text style={styles.planPrice}>
                  {billingCycle === 'monthly' ? '7€ /mois' : '70€ /an'}
                </Text>
                <View style={styles.planFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>4 QR Codes</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>10% de remise partout</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Gestion familiale</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Historique détaillé</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Offres exclusives</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Support prioritaire</Text>
                  </View>
                </View>
              </View>
              <View style={styles.planSelector}>
                <View style={[styles.radioButton, selectedPlan === 'famille' && styles.radioButtonSelected]}>
                  {selectedPlan === 'famille' && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Plan VIP */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'vip' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('vip')}
            >
              <View style={styles.planIcon}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.planIconGradient}
                >
                  <Ionicons name="diamond" size={24} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>VIP</Text>
                <Text style={styles.planPrice}>
                  {billingCycle === 'monthly' ? '12€ /mois' : '120€ /an'}
                </Text>
                <View style={styles.planFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>6 QR Codes</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>10% de remise + bonus</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Offres VIP exclusives</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Concierge personnel</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Accès prioritaire</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>Support 24/7</Text>
                  </View>
                </View>
              </View>
              <View style={styles.planSelector}>
                <View style={[styles.radioButton, selectedPlan === 'vip' && styles.radioButtonSelected]}>
                  {selectedPlan === 'vip' && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
              </View>
            </View>
            </TouchableOpacity>

            {/* Section Pourquoi choisir Maya */}
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.whyChooseSection}
            >
              <Text style={styles.whyChooseText}>Pourquoi choisir Maya ?</Text>
            </LinearGradient>
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  headerGradient: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  } as ViewStyle,
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  titleContainer: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: 'bold',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
  } as TextStyle,
  partnerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  partnerModeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#F59E0B',
  } as TextStyle,
  scrollContainer: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  } as ViewStyle,
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  toggleOptionActive: {
    backgroundColor: '#8B5CF6',
  } as ViewStyle,
  toggleText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  toggleTextActive: {
    color: Colors.text.light,
  } as TextStyle,
  discountBadge: {
    position: 'absolute',
    top: -Spacing.xs,
    right: Spacing.sm,
    backgroundColor: '#10B981',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  discountText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  planCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Shadows.md,
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  planCardPopular: {
    borderColor: '#8B5CF6',
    position: 'relative',
  } as ViewStyle,
  planCardSelected: {
    borderColor: '#8B5CF6',
  } as ViewStyle,
  popularBanner: {
    position: 'absolute',
    top: -Spacing.xs,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#EC4899',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    zIndex: 1,
  } as ViewStyle,
  popularText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  } as ViewStyle,
  planIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  planInfo: {
    flex: 1,
    marginTop: Spacing.lg,
  } as ViewStyle,
  planName: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  planPrice: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  } as TextStyle,
  planFeatures: {
    gap: Spacing.sm,
  } as ViewStyle,
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  featureText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  planSelector: {
    marginTop: Spacing.lg,
    marginLeft: Spacing.md,
  } as ViewStyle,
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  radioButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  } as ViewStyle,
  whyChooseSection: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  whyChooseText: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.light,
    textAlign: 'center',
  } as TextStyle,
});
