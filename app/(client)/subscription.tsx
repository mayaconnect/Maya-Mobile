/**
 * Maya Connect V2 — Subscription Screen (Client)
 *
 * Two views:
 *  1. Active subscription → details card, invoices list, cancel option
 *  2. No subscription → plan comparison with Stripe checkout
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { subscriptionsApi, paymentsApi } from '../../src/api/subscriptions.api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDate } from '../../src/utils/format';
import {
  MButton,
  MCard,
  MBadge,
  MHeader,
  MDivider,
  LoadingSpinner,
  ErrorState,
} from '../../src/components/ui';

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                        */
/* ─────────────────────────────────────────────────────────────── */
export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  /* ── Queries ── */
  const hasSubQ = useQuery({
    queryKey: ['hasSubscription'],
    queryFn: () => subscriptionsApi.hasSubscription(),
    select: (res) => res.data?.hasSubscription ?? false,
  });

  const currentSubQ = useQuery({
    queryKey: ['mySubscription'],
    queryFn: () => subscriptionsApi.getMySubscription(),
    select: (res) => res.data,
    enabled: hasSubQ.data === true,
    retry: false,
  });

  const plansQ = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => subscriptionsApi.getPlans(),
    select: (res) => res.data,
  });

  /* ── Mutations ── */
  const checkoutMutation = useMutation({
    mutationFn: async (planCode: string) => {
      // Build redirect URLs that work on both native (maya://) and web (http://localhost…)
      const successUrl = Linking.createURL('subscription/success');
      const cancelUrl = Linking.createURL('subscription/cancel');

      const res = await paymentsApi.createCheckoutSession({
        planCode,
        successUrl,
        cancelUrl,
      });

      const stripeUrl = res.data?.url;
      if (!stripeUrl) throw new Error('No checkout URL returned');

      // openAuthSessionAsync opens in-app browser and auto-closes when
      // Stripe redirects back to our app scheme (native) or URL (web)
      const result = await WebBrowser.openAuthSessionAsync(stripeUrl, successUrl);

      return result;
    },
    onSuccess: (result) => {
      // Refresh subscription status regardless of how user came back
      queryClient.invalidateQueries({ queryKey: ['hasSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });

      if (result.type === 'success') {
        Alert.alert(
          'Paiement réussi ! 🎉',
          'Votre abonnement est maintenant actif. Profitez de vos réductions !',
        );
      }
      // 'cancel' / 'dismiss' → user closed the browser, no alert needed
    },
    onError: () => {
      Alert.alert('Erreur', 'Impossible de créer la session de paiement.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => paymentsApi.cancelSubscription(),
    onSuccess: () => {
      Alert.alert(
        'Abonnement annulé',
        "Votre abonnement reste actif jusqu'à la fin de la période en cours.",
      );
      queryClient.invalidateQueries({ queryKey: ['hasSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
    },
    onError: () => {
      Alert.alert('Erreur', "Impossible d'annuler votre abonnement.");
    },
  });

  const handleSubscribe = (plan: any) => {
    if (!plan.code) {
      Alert.alert('Erreur', "Ce plan n'est pas encore disponible.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkoutMutation.mutate(plan.code);
  };

  const handleCancel = () => {
    Alert.alert(
      "Annuler l'abonnement",
      'Êtes-vous sûr ? Vous perdrez accès aux réductions à la fin de la période.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ],
    );
  };

  /* ── Loading / Error ── */
  if (plansQ.isLoading || hasSubQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement…" />;
  }

  if (plansQ.isError && hasSubQ.isError) {
    return (
      <View style={styles.container}>
        <MHeader title="Abonnement" showBack onBack={() => router.back()} />
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger les informations d'abonnement."
          onRetry={() => {
            plansQ.refetch();
            hasSubQ.refetch();
          }}
          icon="diamond-outline"
        />
      </View>
    );
  }

  const plans = plansQ.data?.items ?? [];
  const currentSub = currentSubQ.data;
  const hasActiveSub = hasSubQ.data === true && !!currentSub;

  return (
    <View style={styles.container}>
      <MHeader title="Abonnement" showBack onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Active Subscription Details ─── */}
        {hasActiveSub ? (
          <>
            {/* Status Hero */}
            <LinearGradient
              colors={colors.gradients.accent}
              style={styles.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroIconWrap}>
                <Ionicons name="diamond" size={wp(32)} color="#FFF" />
              </View>
              <Text style={styles.heroTitle}>Abonnement actif</Text>
              <Text style={styles.heroDesc}>
                Profitez de vos avantages chez tous nos partenaires
              </Text>
            </LinearGradient>

            {/* Subscription Card */}
            <MCard style={styles.subCard} elevation="lg">
              <View style={styles.subCardHeader}>
                <View>
                  <Text style={styles.subPlanName}>
                    {currentSub.planCode || 'Premium'}
                  </Text>
                  <MBadge
                    label="Actif"
                    variant="success"
                    size="md"
                    style={{ marginTop: spacing[1] }}
                  />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.subPrice}>
                    {formatPrice(currentSub.price)}
                  </Text>
                  <Text style={styles.subPricePeriod}>/mois</Text>
                </View>
              </View>

              <MDivider style={{ marginVertical: spacing[4] }} />

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={wp(18)} color={colors.orange[500]} />
                  <Text style={styles.detailLabel}>Début</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(currentSub.startedAt)}
                  </Text>
                </View>
                {currentSub.expiresAt && (
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={wp(18)} color={colors.orange[500]} />
                    <Text style={styles.detailLabel}>Expire le</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(currentSub.expiresAt)}
                    </Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={wp(18)} color={colors.orange[500]} />
                  <Text style={styles.detailLabel}>Places</Text>
                  <Text style={styles.detailValue}>{currentSub.personsAllowed}</Text>
                </View>
              </View>

              <MDivider style={{ marginVertical: spacing[4] }} />

              {/* Actions */}
              <TouchableOpacity style={styles.actionRow}>
                <Ionicons name="receipt-outline" size={wp(20)} color={colors.orange[500]} />
                <Text style={styles.actionLabel}>Voir mes factures</Text>
                <Ionicons name="chevron-forward" size={wp(18)} color={colors.neutral[300]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionRow, styles.actionRowDanger]}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
              >
                <Ionicons name="close-circle-outline" size={wp(20)} color={colors.error[500]} />
                <Text style={styles.actionLabelDanger}>
                  {cancelMutation.isPending ? 'Annulation…' : "Annuler l'abonnement"}
                </Text>
                <Ionicons name="chevron-forward" size={wp(18)} color={colors.neutral[300]} />
              </TouchableOpacity>
            </MCard>

            {/* Upgrade prompt */}
            {plans.length > 0 && (
              <Text style={styles.upgradeHint}>
                Vous souhaitez changer de formule ? Explorez nos offres ci-dessous.
              </Text>
            )}
          </>
        ) : (
          /* ─── No Subscription — Hero ─── */
          <LinearGradient
            colors={['#FF7A18', '#FFB347']}
            style={styles.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroIconWrap}>
              <Ionicons name="diamond" size={wp(40)} color="#FFF" />
            </View>
            <Text style={styles.heroTitle}>Choisissez votre formule</Text>
            <Text style={styles.heroDesc}>
              Débloquez des réductions exclusives chez tous nos partenaires
            </Text>
          </LinearGradient>
        )}

        {/* ─── Plans ─── */}
        {plans.map((plan: any, idx: number) => {
          const isPopular = idx === 1;
          const isSelected = selectedPlan === plan.id;
          const isCurrentPlan = hasActiveSub && currentSub?.planCode === plan.code;

          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.9}
            >
              <MCard
                style={[
                  styles.planCard,
                  isSelected && styles.planSelected,
                  isPopular && styles.planPopular,
                  isCurrentPlan && styles.planCurrent,
                ]}
                elevation={isSelected ? 'lg' : 'sm'}
              >
                <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                    {isPopular && (
                      <MBadge
                        label="Le plus populaire"
                        variant="violet"
                        size="md"
                        style={{ alignSelf: 'flex-start', marginBottom: spacing[2] }}
                      />
                    )}
                    {isCurrentPlan && (
                      <MBadge
                        label="Votre formule"
                        variant="success"
                        size="md"
                        style={{ alignSelf: 'flex-start', marginBottom: spacing[2] }}
                      />
                    )}
                    <Text style={styles.planName}>{plan.name}</Text>
                  </View>
                  <View style={styles.priceBlock}>
                    <Text style={styles.planPrice}>
                      {formatPrice(plan.priceAmount ?? 0)}
                    </Text>
                    <Text style={styles.planPeriod}>/mois</Text>
                  </View>
                </View>

                {/* Features */}
                <View style={styles.features}>
                  {[
                    `Jusqu'à ${plan.defaultPercent ?? 0}% de réduction`,
                    `${plan.defaultSeats ?? 1} place(s) incluse(s)`,
                    plan.trialDays
                      ? `${plan.trialDays} jours d'essai gratuit`
                      : null,
                    'Accès à tous les partenaires',
                    'QR code illimité',
                  ]
                    .filter(Boolean)
                    .map((feat, fi) => (
                      <View key={fi} style={styles.featureRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={wp(18)}
                          color={colors.success[500]}
                        />
                        <Text style={styles.featureText}>{feat}</Text>
                      </View>
                    ))}
                </View>

                {!isCurrentPlan && (
                  <MButton
                    title={
                      hasActiveSub
                        ? 'Changer de formule'
                        : plan.trialDays
                          ? `Essayer ${plan.trialDays} jours gratuitement`
                          : "S'abonner"
                    }
                    onPress={() => handleSubscribe(plan)}
                    variant={isPopular ? 'secondary' : 'primary'}
                    loading={
                      checkoutMutation.isPending && selectedPlan === plan.id
                    }
                    style={{ marginTop: spacing[4] }}
                  />
                )}
              </MCard>
            </TouchableOpacity>
          );
        })}

        {/* Fine print */}
        <Text style={styles.finePrint}>
          En vous abonnant, vous acceptez nos conditions générales d'utilisation.
          Vous pouvez annuler à tout moment depuis votre profil.
        </Text>
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Styles                                                           */
/* ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: {
    paddingHorizontal: spacing[6],
  },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing[5],
  },
  heroIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  heroTitle: {
    ...textStyles.h3,
    color: '#FFFFFF',
    marginTop: spacing[1],
  },
  heroDesc: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
  },

  /* Active Subscription Card */
  subCard: {
    marginBottom: spacing[4],
    padding: spacing[5],
    backgroundColor: '#1E293B',
  },
  subCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subPlanName: {
    ...textStyles.h4,
    color: colors.neutral[900],
  },
  subPrice: {
    ...textStyles.h3,
    color: colors.orange[500],
  },
  subPricePeriod: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
    gap: spacing[1],
  },
  detailLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
  },
  detailValue: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },

  /* Actions */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
  },
  actionLabel: {
    ...textStyles.body,
    color: colors.neutral[800],
    marginLeft: spacing[3],
    flex: 1,
  },
  actionRowDanger: {
    borderTopWidth: 0,
  },
  actionLabelDanger: {
    ...textStyles.body,
    color: colors.error[500],
    marginLeft: spacing[3],
    flex: 1,
  },
  upgradeHint: {
    ...textStyles.caption,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing[4],
  },

  /* Plans */
  planCard: {
    marginBottom: spacing[4],
    padding: spacing[5],
    backgroundColor: '#1E293B',
  },
  planSelected: {
    borderWidth: 2,
    borderColor: colors.orange[500],
  },
  planPopular: {
    borderWidth: 2,
    borderColor: colors.violet[600],
  },
  planCurrent: {
    borderWidth: 2,
    borderColor: colors.success[500],
    opacity: 0.85,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    ...textStyles.h4,
    color: colors.neutral[900],
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  planPrice: {
    ...textStyles.h2,
    color: colors.orange[500],
  },
  planPeriod: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: -spacing[1],
  },
  features: {
    marginTop: spacing[4],
    gap: spacing[2],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  featureText: {
    ...textStyles.body,
    color: colors.neutral[700],
  },
  finePrint: {
    ...textStyles.micro,
    color: colors.neutral[400],
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
  },
});
