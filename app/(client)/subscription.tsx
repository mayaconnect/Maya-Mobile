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
  Modal,
  Pressable,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { subscriptionsApi, paymentsApi } from '../../src/api/subscriptions.api';
import type { PlanChangePreview } from '../../src/types';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDate } from '../../src/utils/format';
import {
  MButton,
  MCard,
  MBadge,
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
  const [previewData, setPreviewData] = useState<PlanChangePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  type ModalType = 'success-checkout' | 'success-change' | 'success-downgrade-scheduled' | 'confirm-cancel' | 'success-cancel' | 'confirm-upgrade' | 'confirm-downgrade' | 'cooldown-blocked' | 'error';
  const [modal, setModal] = useState<{ type: ModalType; message?: string } | null>(null);
  const closeModal = () => { setModal(null); setPreviewData(null); };

  /* ── Queries ── */
  const hasSubQ = useQuery({
    queryKey: ['hasSubscription'],
    queryFn: async () => {
      console.log('[Subscription] hasSubscription — fetching…');
      const res = await subscriptionsApi.hasSubscription();
      console.log('[Subscription] hasSubscription response:', res.status, JSON.stringify(res.data));
      return res;
    },
    select: (res) => res.data?.hasSubscription ?? false,
  });

  const currentSubQ = useQuery({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      console.log('[Subscription] getMySubscription — fetching…');
      const res = await subscriptionsApi.getMySubscription();
      console.log('[Subscription] getMySubscription response:', res.status, JSON.stringify(res.data));
      return res;
    },
    select: (res) => res.data,
    enabled: hasSubQ.data === true,
    retry: false,
  });

  const plansQ = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      console.log('[Subscription] getPlans — fetching…');
      const res = await subscriptionsApi.getPlans();
      console.log('[Subscription] getPlans response:', res.status, 'count:', res.data?.totalCount, JSON.stringify(res.data?.items?.map((p: any) => ({ id: p.id, code: p.code, name: p.name }))));
      return res;
    },
    select: (res) => res.data,
  });

  /* ── Mutations ── */
  const checkoutMutation = useMutation({
    mutationFn: async (planCode: string) => {
      const successUrl = Linking.createURL('subscription/success');
      const cancelUrl = Linking.createURL('subscription/cancel');
      console.log('[Subscription] createCheckoutSession — planCode:', planCode, '| successUrl:', successUrl);

      const res = await paymentsApi.createCheckoutSession({ planCode, successUrl, cancelUrl });
      console.log('[Subscription] createCheckoutSession response:', res.status, JSON.stringify(res.data));

      const stripeUrl = res.data?.url;
      if (!stripeUrl) throw new Error('No checkout URL returned');

      console.log('[Subscription] opening Stripe URL in browser…');
      const result = await WebBrowser.openAuthSessionAsync(stripeUrl, successUrl);
      console.log('[Subscription] WebBrowser result:', result.type);
      return result;
    },
    onSuccess: (result) => {
      console.log('[Subscription] checkout onSuccess — result type:', result.type);
      queryClient.invalidateQueries({ queryKey: ['hasSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
      if (result.type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setModal({ type: 'success-checkout' });
      }
    },
    onError: (err: any) => {
      console.log('[Subscription] checkout ERROR:', {
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        message: err?.message,
      });
      const detail = err?.response?.data?.detail ?? err?.response?.data?.title ?? err?.message;
      setModal({ type: 'error', message: detail ?? 'Impossible de créer la session de paiement.' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      console.log('[Subscription] cancelSubscription — calling API…');
      const res = await paymentsApi.cancelSubscription();
      console.log('[Subscription] cancelSubscription response:', res.status, JSON.stringify(res.data));
      return res;
    },
    onSuccess: () => {
      console.log('[Subscription] cancel onSuccess');
      queryClient.invalidateQueries({ queryKey: ['hasSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal({ type: 'success-cancel' });
    },
    onError: (err: any) => {
      console.log('[Subscription] cancel ERROR:', {
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        message: err?.message,
      });
      const detail = err?.response?.data?.detail ?? err?.response?.data?.title ?? err?.message;
      setModal({ type: 'error', message: detail ?? "Impossible d'annuler votre abonnement." });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async (planCode: string) => {
      console.log('[Subscription] changePlan — planCode:', planCode);
      const res = await paymentsApi.changePlan({ newPlanCode: planCode });
      console.log('[Subscription] changePlan response:', res.status, JSON.stringify(res.data));
      return res.data;
    },
    onSuccess: (result) => {
      console.log('[Subscription] changePlan onSuccess — isUpgrade:', result.isUpgrade);
      queryClient.invalidateQueries({ queryKey: ['hasSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.isUpgrade) {
        setModal({
          type: 'success-change',
          message: result.proratedAmount
            ? `Votre formule a été mise à niveau. Un montant de ${formatPrice(result.proratedAmount)} au prorata sera facturé.`
            : 'Votre formule a été mise à niveau. Les nouveaux avantages sont disponibles immédiatement.',
        });
      } else {
        setModal({
          type: 'success-downgrade-scheduled',
          message: result.effectiveDate
            ? `Votre changement prendra effet le ${formatDate(result.effectiveDate)}.`
            : 'Votre changement prendra effet à la fin de votre période en cours.',
        });
      }
    },
    onError: (err: any) => {
      console.log('[Subscription] changePlan ERROR:', {
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        message: err?.message,
      });
      const detail = err?.response?.data?.message ?? err?.response?.data?.detail ?? err?.response?.data?.title ?? err?.message;
      setModal({ type: 'error', message: detail ?? 'Impossible de changer de formule.' });
    },
  });

  /** Call preview API, then show appropriate confirmation modal */
  const handleSubscribe = async (plan: any) => {
    if (!plan.code) {
      console.log('[Subscription] handleSubscribe — plan has no code:', plan.id);
      setModal({ type: 'error', message: "Ce plan n'est pas encore disponible." });
      return;
    }
    const hasActive = hasSubQ.data === true;
    console.log('[Subscription] handleSubscribe — planCode:', plan.code, '| hasActiveSub:', hasActive);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!hasActive) {
      // New subscription — direct checkout
      setSelectedPlan(plan.id);
      checkoutMutation.mutate(plan.code);
      return;
    }

    // Existing subscription — preview first
    setSelectedPlan(plan.id);
    setPreviewLoading(true);
    try {
      const res = await paymentsApi.previewPlanChange({ newPlanCode: plan.code });
      const preview = res.data;
      setPreviewData(preview);

      if (!preview.canChange) {
        // Cooldown active
        setModal({ type: 'cooldown-blocked', message: preview.message });
      } else if (preview.isUpgrade) {
        setModal({ type: 'confirm-upgrade' });
      } else {
        setModal({ type: 'confirm-downgrade' });
      }
    } catch (err: any) {
      const detail = err?.response?.data?.message ?? err?.message;
      setModal({ type: 'error', message: detail ?? 'Impossible de vérifier le changement.' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModal({ type: 'confirm-cancel' });
  };

  /* ── Loading / Error ── */
  if (plansQ.isLoading || hasSubQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement…" />;
  }

  if (plansQ.isError && hasSubQ.isError) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={wp(22)} color={colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Abonnement</Text>
          <View style={{ width: wp(36) }} />
        </View>
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger les informations d'abonnement."
          onRetry={() => { plansQ.refetch(); hasSubQ.refetch(); }}
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(22)} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <View style={{ width: wp(36) }} />
      </View>

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
            <View style={styles.hero}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="diamond" size={wp(28)} color={colors.orange[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Abonnement actif</Text>
                <Text style={styles.heroDesc}>Profitez de vos avantages chez tous nos partenaires</Text>
              </View>
              <View style={styles.heroActiveBadge}>
                <View style={styles.heroActiveDot} />
                <Text style={styles.heroActiveTxt}>Actif</Text>
              </View>
            </View>

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
          <View style={styles.heroNoSub}>
            <View style={styles.heroNoSubIcon}>
              <LinearGradient colors={[...colors.gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroNoSubGradient}>
                <Ionicons name="diamond" size={wp(32)} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.heroNoSubTitle}>Choisissez votre formule</Text>
            <Text style={styles.heroNoSubDesc}>Débloquez des réductions exclusives chez tous nos partenaires</Text>
          </View>
        )}

        {/* ─── Plans ─── */}
        {plans.map((plan: any, idx: number) => {
          const isPopular = idx === 1;
          const isSelected = selectedPlan === plan.id;
          const isCurrentPlan = hasActiveSub && currentSub?.planCode === plan.code;

          // Determine upgrade vs downgrade using tier
          const currentPlanObj = hasActiveSub
            ? plans.find((p: any) => p.code === currentSub?.planCode)
            : null;
          const isUpgradePlan = currentPlanObj && (plan.tier ?? 0) > (currentPlanObj.tier ?? 0);
          const isDowngradePlan = currentPlanObj && (plan.tier ?? 0) < (currentPlanObj.tier ?? 0);

          const changeBtnTitle = hasActiveSub
            ? isUpgradePlan
              ? 'Passer au supérieur'
              : isDowngradePlan
                ? 'Réduire ma formule'
                : 'Changer de formule'
            : plan.trialDays
              ? `Essayer ${plan.trialDays} jours gratuitement`
              : "S'abonner";

          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.9}
              disabled={changePlanMutation.isPending || checkoutMutation.isPending}
            >
              <MCard
                style={StyleSheet.flatten([
                  styles.planCard,
                  isSelected && styles.planSelected,
                  isPopular && styles.planPopular,
                  isCurrentPlan && styles.planCurrent,
                ].filter(Boolean)) as ViewStyle}
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
                    title={changeBtnTitle}
                    onPress={() => handleSubscribe(plan)}
                    variant={isPopular ? 'secondary' : isDowngradePlan ? 'outline' : 'primary'}
                    loading={
                      selectedPlan === plan.id &&
                      (checkoutMutation.isPending || changePlanMutation.isPending || previewLoading)
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

      {/* ─── Custom Modals ─── */}
      <Modal visible={!!modal} transparent animationType="fade" statusBarTranslucent onRequestClose={closeModal}>
        <Pressable style={mStyles.backdrop} onPress={modal?.type !== 'confirm-cancel' ? closeModal : undefined}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <View style={mStyles.sheet}>
          {/* Handle */}
          <View style={mStyles.handle} />

          {/* ── Success checkout ── */}
          {modal?.type === 'success-checkout' && (
            <>
              <LinearGradient colors={['#FF7A18', '#FFB347']} style={mStyles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="checkmark" size={wp(36)} color="#FFF" />
              </LinearGradient>
              <Text style={mStyles.title}>Paiement réussi !</Text>
              <Text style={mStyles.body}>Votre abonnement est maintenant actif. Profitez de vos réductions chez tous nos partenaires.</Text>
              <MButton title="Parfait !" onPress={closeModal} style={mStyles.btn} />
            </>
          )}

          {/* ── Success change plan (upgrade) ── */}
          {modal?.type === 'success-change' && (
            <>
              <LinearGradient colors={['#7C3AED', '#A78BFA']} style={mStyles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="arrow-up-circle" size={wp(32)} color="#FFF" />
              </LinearGradient>
              <Text style={mStyles.title}>Formule mise à niveau !</Text>
              <Text style={mStyles.body}>{modal.message ?? 'Votre abonnement a bien été modifié. Les nouveaux avantages sont disponibles immédiatement.'}</Text>
              <MButton title="Super !" onPress={closeModal} style={mStyles.btn} />
            </>
          )}

          {/* ── Success downgrade scheduled ── */}
          {modal?.type === 'success-downgrade-scheduled' && (
            <>
              <LinearGradient colors={['#6366F1', '#818CF8']} style={mStyles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="calendar-outline" size={wp(32)} color="#FFF" />
              </LinearGradient>
              <Text style={mStyles.title}>Changement programmé</Text>
              <Text style={mStyles.body}>{modal.message ?? 'Votre changement prendra effet à la fin de votre période en cours. Vous gardez vos avantages actuels jusque-là.'}</Text>
              <MButton title="Compris" onPress={closeModal} style={mStyles.btn} />
            </>
          )}

          {/* ── Confirm upgrade ── */}
          {modal?.type === 'confirm-upgrade' && previewData && (
            <>
              <LinearGradient colors={['#FF7A18', '#FFB347']} style={mStyles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="arrow-up-circle" size={wp(32)} color="#FFF" />
              </LinearGradient>
              <Text style={mStyles.title}>Confirmer la mise à niveau ?</Text>
              <Text style={mStyles.body}>
                {previewData.proratedAmount != null && previewData.proratedAmount > 0
                  ? `Un montant de ${formatPrice(previewData.proratedAmount)} sera facturé immédiatement. Ce montant correspond au prorata calculé par Stripe pour la différence de prix sur votre période en cours.`
                  : 'Votre abonnement sera immédiatement mis à niveau vers la nouvelle formule.'}
              </Text>
              <View style={mStyles.rowBtns}>
                <MButton title="Annuler" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                <MButton
                  title="Confirmer"
                  variant="primary"
                  loading={changePlanMutation.isPending}
                  onPress={() => {
                    closeModal();
                    if (previewData?.newPlanCode) {
                      changePlanMutation.mutate(previewData.newPlanCode);
                    }
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {/* ── Confirm downgrade ── */}
          {modal?.type === 'confirm-downgrade' && previewData && (
            <>
              <View style={mStyles.iconCircleNeutral}>
                <Ionicons name="arrow-down-circle-outline" size={wp(32)} color={colors.neutral[500]} />
              </View>
              <Text style={mStyles.title}>Réduire votre formule ?</Text>
              <Text style={mStyles.body}>
                {`Votre changement vers ${previewData.newPlanCode} prendra effet le ${formatDate(previewData.effectiveDate)}. Vous garderez vos avantages actuels jusque-là.`}
              </Text>
              <View style={mStyles.rowBtns}>
                <MButton title="Annuler" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                <MButton
                  title="Confirmer"
                  variant="primary"
                  loading={changePlanMutation.isPending}
                  onPress={() => {
                    closeModal();
                    if (previewData?.newPlanCode) {
                      changePlanMutation.mutate(previewData.newPlanCode);
                    }
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {/* ── Cooldown blocked ── */}
          {modal?.type === 'cooldown-blocked' && (
            <>
              <View style={mStyles.iconCircleError}>
                <Ionicons name="time-outline" size={wp(32)} color={colors.error[500]} />
              </View>
              <Text style={mStyles.title}>Changement non disponible</Text>
              <Text style={mStyles.body}>{modal.message ?? 'Vous ne pouvez changer de formule qu\'une fois par mois.'}</Text>
              <MButton title="Compris" variant="outline" onPress={closeModal} style={mStyles.btn} />
            </>
          )}

          {/* ── Confirm cancel ── */}
          {modal?.type === 'confirm-cancel' && (
            <>
              <View style={mStyles.iconCircleError}>
                <Ionicons name="warning-outline" size={wp(32)} color={colors.error[500]} />
              </View>
              <Text style={mStyles.title}>Annuler l'abonnement ?</Text>
              <Text style={mStyles.body}>Vous gardez accès à vos avantages jusqu'à la fin de la période en cours, puis votre abonnement prendra fin.</Text>
              <View style={mStyles.rowBtns}>
                <MButton title="Garder" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                <MButton
                  title="Annuler quand même"
                  variant="danger"
                  loading={cancelMutation.isPending}
                  onPress={() => { closeModal(); cancelMutation.mutate(); }}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {/* ── Success cancel ── */}
          {modal?.type === 'success-cancel' && (
            <>
              <View style={mStyles.iconCircleNeutral}>
                <Ionicons name="checkmark-circle-outline" size={wp(32)} color={colors.neutral[500]} />
              </View>
              <Text style={mStyles.title}>Abonnement annulé</Text>
              <Text style={mStyles.body}>Votre abonnement reste actif jusqu'à la fin de la période en cours. Vous pouvez vous réabonner à tout moment.</Text>
              <MButton title="Compris" onPress={closeModal} style={mStyles.btn} />
            </>
          )}

          {/* ── Error ── */}
          {modal?.type === 'error' && (
            <>
              <View style={mStyles.iconCircleError}>
                <Ionicons name="close-circle-outline" size={wp(32)} color={colors.error[500]} />
              </View>
              <Text style={mStyles.title}>Une erreur est survenue</Text>
              <Text style={mStyles.body}>{modal.message ?? 'Veuillez réessayer.'}</Text>
              <MButton title="Fermer" variant="outline" onPress={closeModal} style={mStyles.btn} />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Styles                                                           */
/* ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    paddingTop: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[50],
  },
  backBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textStyles.h4,
    color: colors.neutral[900],
    fontFamily: fontFamily.bold,
  },

  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },

  /* Hero — abonnement actif (inline row) */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.orange[50],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.orange[100],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  heroIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: colors.orange[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },
  heroDesc: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: 2,
  },
  heroActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.success[200],
    flexShrink: 0,
  },
  heroActiveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.success[500],
  },
  heroActiveTxt: {
    fontSize: wp(11),
    fontFamily: fontFamily.semiBold,
    color: colors.success[600],
  },

  /* Hero — pas d'abonnement (centré) */
  heroNoSub: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginBottom: spacing[4],
  },
  heroNoSubIcon: {
    marginBottom: spacing[4],
    ...shadows.md,
  },
  heroNoSubGradient: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNoSubTitle: {
    ...textStyles.h3,
    color: colors.neutral[900],
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroNoSubDesc: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing[6],
    lineHeight: 22,
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

const mStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    alignItems: 'center',
  },
  handle: {
    width: wp(40),
    height: wp(4),
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[3],
  },
  iconCircle: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[5],
  },
  iconCircleError: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: `${colors.error[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[5],
  },
  iconCircleNeutral: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[5],
  },
  title: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  body: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  btn: {
    width: '100%',
  },
  rowBtns: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
});
