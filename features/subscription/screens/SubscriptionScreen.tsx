import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { PaymentApi } from '@/features/subscription/services/paymentApi';
import { SubscriptionsApi } from '@/features/subscription/services/subscriptionsApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionScreen() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'duo' | 'family'>('duo');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = useState(false);

  // États pour l'abonnement actif
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };

  const handleContinue = () => {
    setShowPaymentModal(true);
  };

  const getPlanPrice = () => {
    const prices = {
      solo: { monthly: 9.90, annual: 99.00 },
      duo: { monthly: 14.90, annual: 149.00 },
      family: { monthly: 24.00, annual: 240.00 },
    };
    return prices[selectedPlan][billingCycle];
  };

  const getPlanName = () => {
    const names = {
      solo: 'Solo',
      duo: 'Duo',
      family: 'Family',
    };
    return names[selectedPlan];
  };

  const getPlanCode = () => {
    // Le planCode doit correspondre exactement à ce qui est dans la base de données
    // La procédure stockée usp_SubscriptionPlan_GetStripePriceId cherche par PlanCode
    // 
    // IMPORTANT: Vérifiez dans votre base de données le format exact des codes de plans
    // Les options possibles :
    // - "Solo", "Duo", "Family" (avec majuscule)
    // - "solo", "duo", "family" (tout en minuscule)
    // - "Solo-Monthly", "Solo-Annual" (avec le cycle de facturation)
    // - Autre format selon votre configuration
    
    const planCodeMap: Record<string, string> = {
      solo: 'Solo',      // ⚠️ MODIFIEZ ICI selon votre base de données
      duo: 'Duo',        // ⚠️ MODIFIEZ ICI selon votre base de données
      family: 'Family',   // ⚠️ MODIFIEZ ICI selon votre base de données
    };
    
    const baseCode = planCodeMap[selectedPlan] || selectedPlan;
    
    // Option 1: Retourner juste le code de base (si le planCode ne dépend pas du cycle)
    return baseCode;
    
    // Option 2: Si votre backend attend le planCode avec le cycle (décommentez cette ligne)
    // const cycle = billingCycle === 'monthly' ? 'Monthly' : 'Annual';
    // return `${baseCode}-${cycle}`;
  };

  // Charger l'abonnement actif
  const loadActiveSubscription = async () => {
    try {
      setIsLoadingSubscription(true);
      console.log('🔍 [Subscription Page] Chargement de l\'abonnement actif...');

      const hasSub = await SubscriptionsApi.hasActiveSubscription();
      setHasActiveSubscription(hasSub);

      if (hasSub) {
        const sub = await SubscriptionsApi.getMyActiveSubscription();
        setActiveSubscription(sub);
        console.log('✅ [Subscription Page] Abonnement actif chargé:', sub);
      } else {
        setActiveSubscription(null);
        console.log('ℹ️ [Subscription Page] Aucun abonnement actif');
      }
    } catch (error) {
      console.error('❌ [Subscription Page] Erreur lors du chargement de l\'abonnement:', error);
      setHasActiveSubscription(false);
      setActiveSubscription(null);
    } finally {
      setIsLoadingSubscription(false);
      setRefreshing(false);
    }
  };

  // Rafraîchir l'abonnement
  const onRefresh = () => {
    setRefreshing(true);
    loadActiveSubscription();
  };

  // Charger l'abonnement au montage du composant
  useEffect(() => {
    loadActiveSubscription();
  }, []);

  // Vérifier la disponibilité des méthodes de paiement
  useEffect(() => {
    const checkPaymentMethods = async () => {
      // TODO: Implémenter isApplePayAvailable et isGooglePayAvailable dans PaymentApi si nécessaire
      // Pour l'instant, on désactive ces fonctionnalités
      setApplePayAvailable(false);
      setGooglePayAvailable(false);
    };
    checkPaymentMethods();
  }, []);

  // Fonction pour vérifier le statut du paiement avec retry
  const checkPaymentStatusWithRetry = async (sessionId: string, retries = 3, delay = 2000): Promise<void> => {
    setIsCheckingPaymentStatus(true);
    let statusResult: { status: string; paymentStatus?: string; subscriptionId?: string; message?: string } | null = null;
    
    try {
      console.log('🔍 [Subscription] Vérification du statut du paiement...', {
        sessionId: sessionId.substring(0, 20) + '...',
        retries,
      });

      statusResult = await PaymentApi.checkPaymentSessionStatus(sessionId);
      
      console.log('📊 [Subscription] Statut du paiement récupéré:', {
        status: statusResult.status,
        paymentStatus: statusResult.paymentStatus,
        hasSubscriptionId: !!statusResult.subscriptionId,
      });

      if (statusResult.status === 'complete' && statusResult.paymentStatus === 'paid') {
        // Paiement confirmé avec succès
        console.log('✅ [Subscription] Paiement confirmé et complété');
        setIsCheckingPaymentStatus(false);
        Alert.alert(
          '✅ Paiement confirmé',
          `Votre abonnement a été activé avec succès !${statusResult.subscriptionId ? '\n\nID d\'abonnement: ' + statusResult.subscriptionId : ''}`,
          [
            {
              text: 'Parfait',
              onPress: () => {
                setShowPaymentModal(false);
                setSelectedPaymentMethod(null);
                setCheckoutSessionId(null);
                router.replace('/(tabs)/home');
              },
            },
          ]
        );
      } else if (statusResult.status === 'processing' || statusResult.status === 'open') {
        // Paiement en cours de traitement ou en attente
        if (retries > 0) {
          console.log(`⏳ [Subscription] Paiement en cours, nouvelle tentative dans ${delay}ms...`);
          // Ne pas mettre à jour isCheckingPaymentStatus ici, on continue les retries
          setTimeout(() => {
            checkPaymentStatusWithRetry(sessionId, retries - 1, delay);
          }, delay);
        } else {
          // Plus de tentatives, afficher un message d'attente
          console.log('⏳ [Subscription] Paiement en cours de traitement par le serveur');
          setIsCheckingPaymentStatus(false);
          Alert.alert(
            '⏳ Paiement en cours',
            'Votre paiement est en cours de traitement. Vous recevrez une confirmation une fois le traitement terminé. Le webhook va finaliser le paiement côté serveur.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setShowPaymentModal(false);
                  setSelectedPaymentMethod(null);
                  setCheckoutSessionId(null);
                  router.replace('/(tabs)/home');
                },
              },
            ]
          );
        }
      } else if (statusResult.status === 'expired') {
        // Session expirée
        console.log('❌ [Subscription] Session de paiement expirée');
        setIsCheckingPaymentStatus(false);
        Alert.alert(
          '⏰ Session expirée',
          'La session de paiement a expiré. Veuillez réessayer.',
          [
            {
              text: 'Réessayer',
              onPress: () => {
                setCheckoutSessionId(null);
              },
            },
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => {
                setShowPaymentModal(false);
                setSelectedPaymentMethod(null);
                setCheckoutSessionId(null);
              },
            },
          ]
        );
      } else {
        // Erreur ou statut inconnu
        console.error('❌ [Subscription] Statut de paiement inattendu:', statusResult.status);
        setIsCheckingPaymentStatus(false);
        Alert.alert(
          '⚠️ Statut du paiement',
          statusResult.message || 'Impossible de vérifier le statut du paiement. Veuillez vérifier votre abonnement dans quelques instants.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPaymentModal(false);
                setSelectedPaymentMethod(null);
                setCheckoutSessionId(null);
                router.replace('/(tabs)/home');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ [Subscription] Erreur lors de la vérification du statut:', error);
      setIsCheckingPaymentStatus(false);
      
      // En cas d'erreur, afficher un message mais permettre à l'utilisateur de continuer
      Alert.alert(
        '⚠️ Vérification du paiement',
        'Nous n\'avons pas pu vérifier immédiatement le statut de votre paiement. Le webhook va traiter le paiement côté serveur. Vous recevrez une confirmation une fois le traitement terminé.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPaymentModal(false);
              setSelectedPaymentMethod(null);
              setCheckoutSessionId(null);
              router.replace('/(tabs)/home');
            },
          },
        ]
      );
    }
  };

  // Écouter les deep links de retour depuis Stripe
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 [Subscription] Deep link reçu:', url);
      
      // Vérifier si c'est un retour depuis Stripe
      if (url.includes('subscription/success')) {
        // Parser l'URL pour extraire le session_id (compatible React Native)
        let sessionId = checkoutSessionId;
        const sessionIdMatch = url.match(/[?&]session_id=([^&]+)/);
        if (sessionIdMatch) {
          sessionId = decodeURIComponent(sessionIdMatch[1]);
        }
        
        if (sessionId) {
          console.log('✅ [Subscription] Retour depuis Stripe, session ID:', sessionId);
          
          // Vérifier le statut du paiement
          await checkPaymentStatusWithRetry(sessionId);
        } else {
          console.warn('⚠️ [Subscription] Aucun session_id trouvé dans l\'URL');
          Alert.alert(
            '⚠️ Information manquante',
            'Impossible de vérifier le statut du paiement. Veuillez vérifier votre abonnement dans quelques instants.',
            [{ text: 'OK' }]
          );
        }
      } else if (url.includes('subscription/cancel')) {
        console.log('❌ [Subscription] Paiement annulé');
        Alert.alert(
          'Paiement annulé',
          'Vous avez annulé le paiement. Vous pouvez réessayer à tout moment.',
          [{ text: 'OK' }]
        );
        setCheckoutSessionId(null);
        setIsCheckingPaymentStatus(false);
      }
    };

    // Écouter les événements de deep linking
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Vérifier si l'app a été ouverte via un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkoutSessionId, router]);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) return;

    setIsProcessingPayment(true);

    try {
      // Créer une session de checkout via l'API
      // Le planCode doit correspondre exactement à ce qui est dans la base de données
      // La procédure stockée usp_SubscriptionPlan_GetStripePriceId cherche par PlanCode
      const planCode = getPlanCode();
      
      // Construire les URLs de redirection avec support du placeholder {CHECKOUT_SESSION_ID}
      // Stripe remplacera automatiquement {CHECKOUT_SESSION_ID} par l'ID de session réel
      const baseUrl = 'maya://subscription';
      const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/cancel`;

      console.log('💳 [Subscription] Création de la session de checkout:', { 
        planCode, 
        billingCycle,
        successUrl, 
        cancelUrl 
      });

      const checkoutSession = await PaymentApi.createCheckoutSession({
        planId: planCode,
        billingCycle,
      });

      console.log('✅ [Subscription] Session de checkout créée:', {
        hasUrl: !!checkoutSession?.url,
        hasSessionId: !!checkoutSession?.sessionId,
        sessionId: checkoutSession?.sessionId,
      });

      // Stocker le sessionId pour le deep link de retour
      if (checkoutSession?.sessionId) {
        setCheckoutSessionId(checkoutSession.sessionId);
      }

      // Si l'API retourne une URL Stripe, ouvrir dans un navigateur in-app
      if (checkoutSession?.url) {
        console.log('🌐 [Subscription] Ouverture de Stripe Checkout dans le navigateur in-app');
        
        try {
          // Utiliser expo-web-browser pour ouvrir dans un navigateur in-app
          // Cela permet de rester dans l'app et de gérer les redirections
          const result = await WebBrowser.openBrowserAsync(checkoutSession.url, {
            // Options pour un meilleur contrôle
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
            controlsColor: '#8B2F3F', // Couleur de l'app
            toolbarColor: '#8B2F3F',
            enableBarCollapsing: false,
          });

          console.log('📱 [Subscription] Résultat du navigateur:', result.type);

          // Si l'utilisateur ferme le navigateur sans compléter
          if (result.type === 'cancel' || result.type === 'dismiss') {
            console.log('⚠️ [Subscription] Navigateur fermé sans compléter le paiement');
            // Ne pas afficher d'erreur, l'utilisateur peut réessayer
            setShowPaymentModal(false);
            setSelectedPaymentMethod(null);
          }
          // Note: Les redirections success/cancel sont gérées par le deep link listener
        } catch (error) {
          console.error('❌ [Subscription] Erreur lors de l\'ouverture du navigateur:', error);
          
          // Fallback: essayer avec Linking si WebBrowser échoue
          const canOpen = await Linking.canOpenURL(checkoutSession.url);
          if (canOpen) {
            await Linking.openURL(checkoutSession.url);
          } else {
            throw new Error('Impossible d\'ouvrir la page de paiement');
          }
        }
      } else if (checkoutSession?.sessionId) {
        // Si on a seulement un sessionId (cas rare), informer l'utilisateur
        console.warn('⚠️ [Subscription] Session créée mais pas d\'URL retournée');
        Alert.alert(
          '✅ Session créée',
          `Session de paiement créée avec succès.\n\nSession ID: ${checkoutSession.sessionId}\n\nLe webhook va traiter le paiement côté serveur.`,
          [
            {
              text: 'Parfait',
              onPress: () => {
                setShowPaymentModal(false);
                setSelectedPaymentMethod(null);
              },
            },
          ]
        );
      } else {
        throw new Error('Réponse inattendue de l\'API: ni URL ni sessionId retourné');
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      Alert.alert(
        '❌ Erreur',
        error instanceof Error ? error.message : 'Une erreur inattendue est survenue. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <NavigationTransition children={<></>}>
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.text.light}
              />
            }
          >
            {isLoadingSubscription ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary[600]} />
                <Text style={styles.loadingText}>Chargement de votre abonnement...</Text>
              </View>
            ) : hasActiveSubscription && activeSubscription ? (
              // Afficher l'abonnement actif
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Mon abonnement</Text>
                  <Text style={styles.subtitle}>Gérez votre abonnement actuel</Text>
                </View>

                {/* Carte de l'abonnement actif */}
                <View style={styles.activeSubscriptionCard}>
                  <View style={styles.activeSubHeader}>
                    <View style={styles.activeSubIcon}>
                      <LinearGradient
                        colors={['#8B2F3F', '#7B1F2F']}
                        style={styles.planIconGradient}
                      >
                        <Ionicons name="shield-checkmark" size={32} color="white" />
                      </LinearGradient>
                    </View>
                    <View style={styles.activeSubBadge}>
                      <View style={styles.activeBadgeDot} />
                      <Text style={styles.activeBadgeText}>Actif</Text>
                    </View>
                  </View>

                  <Text style={styles.activeSubPlan}>
                    Plan {activeSubscription.planCode || 'Premium'}
                  </Text>

                  {activeSubscription.price > 0 ? (
                    <Text style={styles.activeSubPrice}>
                      {activeSubscription.price}€ / mois
                    </Text>
                  ) : (
                    <Text style={styles.activeSubPrice}>Gratuit</Text>
                  )}

                  {activeSubscription.personsAllowed && (
                    <View style={styles.activeSubFeature}>
                      <Ionicons name="people" size={20} color={Colors.primary[600]} />
                      <Text style={styles.activeSubFeatureText}>
                        {activeSubscription.personsAllowed} {activeSubscription.personsAllowed > 1 ? 'personnes' : 'personne'}
                      </Text>
                    </View>
                  )}

                  {activeSubscription.startedAt && (
                    <View style={styles.activeSubInfo}>
                      <Ionicons name="calendar" size={16} color={Colors.text.secondary} />
                      <Text style={styles.activeSubInfoText}>
                        Actif depuis le {new Date(activeSubscription.startedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}

                  {activeSubscription.expiresAt && activeSubscription.expiresAt !== null ? (
                    <View style={styles.activeSubInfo}>
                      <Ionicons name="time" size={16} color={Colors.text.secondary} />
                      <Text style={styles.activeSubInfoText}>
                        Expire le {new Date(activeSubscription.expiresAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.activeSubInfo}>
                      <Ionicons name="refresh" size={16} color={Colors.text.secondary} />
                      <Text style={styles.activeSubInfoText}>
                        Renouvelé automatiquement
                      </Text>
                    </View>
                  )}
                </View>

                {/* Options de gestion */}
                <View style={styles.managementSection}>
                  <Text style={styles.managementTitle}>Options</Text>

                  <TouchableOpacity style={styles.managementOption}>
                    <View style={styles.managementOptionIcon}>
                      <Ionicons name="card-outline" size={24} color={Colors.primary[600]} />
                    </View>
                    <View style={styles.managementOptionInfo}>
                      <Text style={styles.managementOptionTitle}>Moyen de paiement</Text>
                      <Text style={styles.managementOptionDescription}>
                        Gérer vos méthodes de paiement
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.managementOption}>
                    <View style={styles.managementOptionIcon}>
                      <Ionicons name="receipt-outline" size={24} color={Colors.primary[600]} />
                    </View>
                    <View style={styles.managementOptionInfo}>
                      <Text style={styles.managementOptionTitle}>Historique de facturation</Text>
                      <Text style={styles.managementOptionDescription}>
                        Voir toutes vos factures
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.managementOption, styles.managementOptionDanger]}
                    onPress={() => {
                      Alert.alert(
                        'Résilier l\'abonnement',
                        'Êtes-vous sûr de vouloir résilier votre abonnement ? Vous perdrez tous les avantages.',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          { text: 'Résilier', style: 'destructive', onPress: () => {
                            // TODO: Implémenter la résiliation
                            Alert.alert('À venir', 'La résiliation sera disponible prochainement.');
                          }},
                        ]
                      );
                    }}
                  >
                    <View style={styles.managementOptionIcon}>
                      <Ionicons name="close-circle-outline" size={24} color={Colors.status.error} />
                    </View>
                    <View style={styles.managementOptionInfo}>
                      <Text style={[styles.managementOptionTitle, styles.managementOptionDangerText]}>
                        Résilier l'abonnement
                      </Text>
                      <Text style={styles.managementOptionDescription}>
                        Annuler votre abonnement
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Afficher les options d'abonnement
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Choisissez votre plan</Text>
                  <Text style={styles.subtitle}>Économisez jusqu&apos;à 20% chez tous nos partenaires</Text>
                </View>
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

            {/* Plan Solo */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'solo' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('solo')}
            >
              <View style={styles.planIcon}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.planIconGradient}
                >
                  <Ionicons name="person" size={24} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Solo</Text>
                <Text style={styles.planPrice}>
                  {billingCycle === 'monthly' ? '9,90€ /mois' : '99,00€ /an'}
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
                <View style={[styles.radioButton, selectedPlan === 'solo' && styles.radioButtonSelected]}>
                  {selectedPlan === 'solo' && (
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
                  colors={['#8B2F3F', '#7B1F2F']}
                  style={styles.planIconGradient}
                >
                  <Ionicons name="people" size={24} color="white" />
                </LinearGradient>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Duo</Text>
                <Text style={styles.planPrice}>
                  {billingCycle === 'monthly' ? '14,90€ /mois' : '149,00€ /an'}
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

            {/* Plan Family */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'family' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('family')}
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
                <Text style={styles.planName}>Family</Text>
                <Text style={styles.planPrice}>
                  {billingCycle === 'monthly' ? '24,00€ /mois' : '240,00€ /an'}
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
                <View style={[styles.radioButton, selectedPlan === 'family' && styles.radioButtonSelected]}>
                  {selectedPlan === 'family' && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Section Pourquoi choisir Maya */}
            <LinearGradient
              colors={['#8B2F3F', '#9B3F4F']}
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
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

        {/* Modal de sélection du paiement */}
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => !isCheckingPaymentStatus && setShowPaymentModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Overlay de chargement pour la vérification du statut */}
            {isCheckingPaymentStatus && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color={Colors.primary[600]} />
                  <Text style={styles.loadingText}>Vérification du paiement en cours...</Text>
                  <Text style={styles.loadingSubtext}>Veuillez patienter quelques instants</Text>
                </View>
              </View>
            )}
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
                    {getPlanPrice().toFixed(2).replace('.', ',')}€ {billingCycle === 'monthly' ? '/mois' : '/an'}
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
                  colors={selectedPaymentMethod && !isProcessingPayment ? ['#8B2F3F', '#7B1F2F'] : ['#D1D5DB', '#9CA3AF']}
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
                      Payer {getPlanPrice().toFixed(2).replace('.', ',')}€ {billingCycle === 'monthly' ? '/mois' : '/an'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  titleContainer: {
    flex: 1,
  } as ViewStyle,
  partnerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    backgroundColor: '#8B2F3F',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Shadows.md,
  } as ViewStyle,
  planCardPopular: {
    borderColor: '#8B2F3F',
    position: 'relative',
  } as ViewStyle,
  planCardSelected: {
    borderColor: '#8B2F3F',
  } as ViewStyle,
  popularBanner: {
    position: 'absolute',
    top: -Spacing.xs,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#9B3F4F',
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
    backgroundColor: '#8B2F3F',
    borderColor: '#8B2F3F',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
  
  // Overlay de chargement pour la vérification
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  } as ViewStyle,
  loadingCard: {
    backgroundColor: Colors.background.light,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
    ...Shadows.lg,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    textAlign: 'center',
  } as TextStyle,
  loadingSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  } as TextStyle,

  // Styles pour le chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  } as ViewStyle,

  // Styles pour l'abonnement actif
  activeSubscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#8B2F3F',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  } as ViewStyle,
  activeSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  activeSubIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  } as ViewStyle,
  activeSubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  } as ViewStyle,
  activeBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#10B981',
  } as ViewStyle,
  activeBadgeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
  activeSubPlan: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  activeSubPrice: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  } as TextStyle,
  activeSubFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  } as ViewStyle,
  activeSubFeatureText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  activeSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  } as ViewStyle,
  activeSubInfoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,

  // Options de gestion
  managementSection: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  managementTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.md,
  } as TextStyle,
  managementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  managementOptionDanger: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  } as ViewStyle,
  managementOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  managementOptionInfo: {
    flex: 1,
  } as ViewStyle,
  managementOptionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  managementOptionDangerText: {
    color: Colors.status.error,
  } as TextStyle,
  managementOptionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
});
