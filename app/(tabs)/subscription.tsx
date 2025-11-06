import { NavigationTransition } from '@/components/common/navigation-transition';
import { SubscriptionHeader } from '@/components/headers/subscription-header';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { PaymentService, PaymentRequest } from '@/services/payment.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <SubscriptionHeader
            title="Choisissez votre plan"
            subtitle="Économisez 10% partout avec Maya"
            currentPlan="Duo"
            onNotificationPress={() => console.log('Notifications')}
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

            {/* Bouton Continuer */}
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
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
        </View>

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
                  colors={selectedPaymentMethod && !isProcessingPayment ? ['#8B5CF6', '#7C3AED'] : ['#D1D5DB', '#9CA3AF']}
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
  
  // Bouton Continuer
  continueButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  } as ViewStyle,
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  } as ViewStyle,
  continueButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: 'white',
  } as TextStyle,
  
  // Modal de paiement
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[100],
  } as ViewStyle,
  modalCloseButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  } as TextStyle,
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  } as ViewStyle,
  
  // Récapitulatif
  summaryCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  } as ViewStyle,
  summaryTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  } as TextStyle,
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  summaryTotal: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.primary[100],
  } as ViewStyle,
  summaryLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  summaryValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  } as TextStyle,
  summaryTotalLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  } as TextStyle,
  summaryTotalValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.primary[600],
  } as TextStyle,
  
  // Section paiement
  paymentSectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  } as TextStyle,
  
  // Méthodes de paiement
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.sm,
  } as ViewStyle,
  paymentMethodCardSelected: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  } as ViewStyle,
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  paymentMethodInfo: {
    flex: 1,
  } as ViewStyle,
  paymentMethodName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  paymentMethodDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  paymentMethodRadio: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  paymentMethodRadioEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary[200],
  } as ViewStyle,
  
  // Bouton Payer
  payButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  } as ViewStyle,
  payButtonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  payButtonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
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
    fontWeight: '700',
    color: 'white',
  } as TextStyle,
});
