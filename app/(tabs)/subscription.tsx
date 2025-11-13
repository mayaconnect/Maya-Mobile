import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { PaymentRequest, PaymentService } from '@/services/payment.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionScreen() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'individual' | 'duo' | 'famille' | 'vip'>('duo');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  const handleContinue = () => {
    setShowPaymentModal(true);
  };

  const getPlanPrice = () => {
    const prices = {
      individual: { monthly: 3, annual: 30 },
      duo: { monthly: 5, annual: 50 },
      famille: { monthly: 7, annual: 70 },
      vip: { monthly: 12, annual: 120 },
    };
    return prices[selectedPlan][billingCycle];
  };

  const getPlanName = () => {
    const names = {
      individual: 'Individuel',
      duo: 'Duo',
      famille: 'Famille',
      vip: 'VIP',
    };
    return names[selectedPlan];
  };

  // Vérifier la disponibilité des méthodes de paiement
  useEffect(() => {
    const checkPaymentMethods = async () => {
      const applePay = await PaymentService.isApplePayAvailable();
      const googlePay = await PaymentService.isGooglePayAvailable();
      setApplePayAvailable(applePay);
      setGooglePayAvailable(googlePay);
    };
    checkPaymentMethods();
  }, []);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) return;

    setIsProcessingPayment(true);

    try {
      const paymentRequest: PaymentRequest = {
        amount: getPlanPrice(),
        currency: 'EUR',
        planId: selectedPlan,
        planName: getPlanName(),
        billingCycle,
        paymentMethod: selectedPaymentMethod as any,
      };

      const response = await PaymentService.processPayment(paymentRequest);

      if (response.success) {
        Alert.alert(
          '✅ Paiement réussi',
          `Votre abonnement ${getPlanName()} a été activé avec succès.\n\nTransaction: ${response.transactionId}`,
          [
            {
              text: 'Parfait',
              onPress: () => {
                setShowPaymentModal(false);
                setSelectedPaymentMethod(null);
                // router.replace('/(tabs)/home');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          '❌ Erreur de paiement',
          response.error || 'Une erreur est survenue lors du paiement',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      Alert.alert(
        '❌ Erreur',
        'Une erreur inattendue est survenue. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
     <NavigationTransition>
      <View style={styles.screen}>
        <LinearGradient
          colors={['#450A1D', '#120A18']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <NeoCard gradient={['#4C0F22', '#1A112A']} style={styles.heroCard}>
              <Text style={styles.heroTitle}>Choisissez votre plan</Text>
              <Text style={styles.heroSubtitle}>Économisez jusqu’à 20% chez tous nos partenaires</Text>
              <View style={styles.heroSummaryRow}>
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryValue}>Duo</Text>
                  <Text style={styles.heroSummaryLabel}>Plan actuel</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryValue}>-20%</Text>
                  <Text style={styles.heroSummaryLabel}>en annuel</Text>
                </View>
              </View>
            </NeoCard>

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
              colors={Colors.gradients.violet}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.whyChooseSection}
            >
              <Text style={styles.whyChooseText}>Pourquoi choisir Maya ?</Text>
            </LinearGradient>

            {/* Bouton Continuer */}
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.accent.rose, Colors.accent.cyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>
                  Continuer vers le paiement
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        {/* Modal de sélection du paiement */}
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Choisir un moyen de paiement</Text>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Récapitulatif de l'abonnement */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Plan sélectionné</Text>
                  <Text style={styles.summaryValue}>{getPlanName()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Période</Text>
                  <Text style={styles.summaryValue}>
                    {billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>
                    {getPlanPrice()}€ {billingCycle === 'monthly' ? '/mois' : '/an'}
                  </Text>
                </View>
              </View>

              {/* Méthodes de paiement */}
              <Text style={styles.paymentSectionTitle}>Moyens de paiement</Text>

              {/* Carte bancaire */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'card' && styles.paymentMethodCardSelected
                ]}
                onPress={() => setSelectedPaymentMethod('card')}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name="card" size={24} color={Colors.primary[600]} />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>Carte bancaire</Text>
                  <Text style={styles.paymentMethodDescription}>
                    Visa, Mastercard, American Express
                  </Text>
                </View>
                <View style={styles.paymentMethodRadio}>
                  {selectedPaymentMethod === 'card' && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary[600]} />
                  )}
                  {selectedPaymentMethod !== 'card' && (
                    <View style={styles.paymentMethodRadioEmpty} />
                  )}
                </View>
              </TouchableOpacity>

              {/* PayPal */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === 'paypal' && styles.paymentMethodCardSelected
                ]}
                onPress={() => setSelectedPaymentMethod('paypal')}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name="logo-paypal" size={24} color="#0070BA" />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>PayPal</Text>
                  <Text style={styles.paymentMethodDescription}>
                    Payer avec votre compte PayPal
                  </Text>
                </View>
                <View style={styles.paymentMethodRadio}>
                  {selectedPaymentMethod === 'paypal' && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary[600]} />
                  )}
                  {selectedPaymentMethod !== 'paypal' && (
                    <View style={styles.paymentMethodRadioEmpty} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Apple Pay */}
              {applePayAvailable && (
                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === 'applepay' && styles.paymentMethodCardSelected
                  ]}
                  onPress={() => setSelectedPaymentMethod('applepay')}
                >
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons name="logo-apple" size={24} color={Colors.text.primary} />
                  </View>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodName}>Apple Pay</Text>
                    <Text style={styles.paymentMethodDescription}>
                      Paiement rapide et sécurisé
                    </Text>
                  </View>
                  <View style={styles.paymentMethodRadio}>
                    {selectedPaymentMethod === 'applepay' && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary[600]} />
                    )}
                    {selectedPaymentMethod !== 'applepay' && (
                      <View style={styles.paymentMethodRadioEmpty} />
                    )}
                  </View>
                </TouchableOpacity>
              )}

              {/* Google Pay */}
              {googlePayAvailable && (
                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethod === 'googlepay' && styles.paymentMethodCardSelected
                  ]}
                  onPress={() => setSelectedPaymentMethod('googlepay')}
                >
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons name="logo-google" size={24} color="#4285F4" />
                  </View>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodName}>Google Pay</Text>
                    <Text style={styles.paymentMethodDescription}>
                      Paiement rapide et sécurisé
                    </Text>
                  </View>
                  <View style={styles.paymentMethodRadio}>
                    {selectedPaymentMethod === 'googlepay' && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary[600]} />
                    )}
                    {selectedPaymentMethod !== 'googlepay' && (
                      <View style={styles.paymentMethodRadioEmpty} />
                    )}
                  </View>
                </TouchableOpacity>
              )}

              {/* Bouton Payer */}
              <TouchableOpacity
                style={[
                  styles.payButton,
                  (!selectedPaymentMethod || isProcessingPayment) && styles.payButtonDisabled
                ]}
                onPress={handlePayment}
                disabled={!selectedPaymentMethod || isProcessingPayment}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentMethod && !isProcessingPayment
                    ? [Colors.accent.rose, Colors.accent.cyan]
                    : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payButtonGradient}
                >
                  {isProcessingPayment ? (
                    <View style={styles.payButtonLoading}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.payButtonText}>
                        Traitement en cours...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.payButtonText}>
                      Payer {getPlanPrice()}€ {billingCycle === 'monthly' ? '/mois' : '/an'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    position: 'relative',
    top: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  } as ViewStyle,
  heroCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
    gap: Spacing.lg,
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
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
  } as ViewStyle,
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  } as ViewStyle,
  toggleOptionActive: {
    backgroundColor: Colors.accent.rose,
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  } as ViewStyle,
  toggleText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium as any,
    color: Colors.text.muted,
  } as TextStyle,
  toggleTextActive: {
    color: Colors.text.light,
  } as TextStyle,
  discountBadge: {
    position: 'absolute',
    top: -Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(39,239,161,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.2,
    borderWidth: 1,
    borderColor: 'rgba(39,239,161,0.35)',
  } as ViewStyle,
  discountText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.secondary[300],
  } as TextStyle,
  planCard: {
    backgroundColor: 'rgba(15,14,24,0.92)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  } as ViewStyle,
  planCardPopular: {
    borderColor: Colors.accent.rose,
  } as ViewStyle,
  planCardSelected: {
    borderColor: Colors.accent.rose,
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  } as ViewStyle,
  popularBanner: {
    position: 'absolute',
    top: -Spacing.md,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: 'rgba(255,107,107,0.85)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  popularText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } as TextStyle,
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  } as ViewStyle,
  planIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  planInfo: {
    flex: 1,
    gap: Spacing.sm,
  } as ViewStyle,
  planName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  planPrice: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium as any,
    color: Colors.text.secondary,
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
    color: Colors.text.muted,
  } as TextStyle,
  planSelector: {
    justifyContent: 'center',
  } as ViewStyle,
  radioButton: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  radioButtonSelected: {
    borderColor: Colors.accent.rose,
    backgroundColor: 'rgba(251,76,136,0.45)',
  } as ViewStyle,
  whyChooseSection: {
    borderRadius: BorderRadius['3xl'],
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  whyChooseText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  continueButton: {
    borderRadius: BorderRadius['3xl'],
    overflow: 'hidden',
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
  } as ViewStyle,
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  } as ViewStyle,
  continueButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(8,8,14,0.96)',
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    gap: Spacing['2xl'],
  } as ViewStyle,
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.sm,
  } as ViewStyle,
  summaryTitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.muted,
  } as TextStyle,
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  summaryLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  } as TextStyle,
  summaryValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  summaryTotal: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  summaryTotalLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  summaryTotalValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: Colors.accent.rose,
  } as TextStyle,
  paymentSectionTitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  } as TextStyle,
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.md,
  } as ViewStyle,
  paymentMethodCardSelected: {
    borderColor: Colors.accent.rose,
    backgroundColor: 'rgba(251,76,136,0.18)',
  } as ViewStyle,
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  paymentMethodInfo: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  paymentMethodName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  paymentMethodDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  } as TextStyle,
  paymentMethodRadio: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  paymentMethodRadioEmpty: {
    width: 14,
    height: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  payButton: {
    borderRadius: BorderRadius['3xl'],
    overflow: 'hidden',
    marginBottom: Spacing['2xl'],
  } as ViewStyle,
  payButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  payButtonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  payButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  payButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
});
