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
import type { PlanChangePreview, AddonSubscriptionDto } from '../../src/types';
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
  const [activeTab, setActiveTab] = useState<'main' | 'addon'>('main');

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

  const addonSubsQ = useQuery({
    queryKey: ['myAddonSubscriptions'],
    queryFn: () => subscriptionsApi.getMyAddonSubscriptions(),
    select: (res) => res.data ?? [],
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
      queryClient.invalidateQueries({ queryKey: ['myAddonSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['myPromoCodes'] });
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
    const ADDON_CODES = ['shotgun', 'sunbed'];
    const isAddon =
      ADDON_CODES.some((k) =>
        (plan.code ?? '').toLowerCase().includes(k) ||
        (plan.name ?? '').toLowerCase().includes(k),
      ) || addonPlanCodes.has(plan.code);
    console.log('[Subscription] handleSubscribe — planCode:', plan.code, '| hasActiveSub:', hasActive, '| isAddon:', isAddon, '| tier:', plan.tier);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Add-ons always go through direct checkout (never plan change preview)
    if (!hasActive || isAddon) {
      setSelectedPlan(plan.id);
      checkoutMutation.mutate(plan.code);
      return;
    }

    // Main plan change — preview first
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

  const allPlans = plansQ.data?.items ?? [];
  const currentSub = currentSubQ.data;
  const hasActiveSub = hasSubQ.data === true && !!currentSub;
  const addonSubs: AddonSubscriptionDto[] = addonSubsQ.data ?? [];
  const addonPlanCodes = new Set(addonSubs.map((a) => a.planCode));

  const ADDON_CODES = ['shotgun', 'sunbed'];
  const isAddonPlan = (p: any) =>
    ADDON_CODES.some((k) =>
      (p.code ?? '').toLowerCase().includes(k) ||
      (p.name ?? '').toLowerCase().includes(k),
    );
  const mainPlans = allPlans.filter((p: any) => !isAddonPlan(p));
  const addonPlansList = allPlans.filter((p: any) => isAddonPlan(p));

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(22)} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <View style={{ width: wp(36) }} />
      </View>

      {/* ── Hero ── */}
      {hasActiveSub ? (
        <View style={styles.heroPad}>
          <LinearGradient colors={[...colors.gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroActiveBanner}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="diamond" size={wp(22)} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroActiveTitle}>
                {currentSub.planName ?? currentSub.planCode ?? 'Abonnement'}
              </Text>
              <Text style={styles.heroActiveDesc}>
                {formatPrice(currentSub.price)}/mois · Actif
              </Text>
            </View>
            <View style={styles.heroActiveDotWrap}>
              <View style={styles.heroActiveDot} />
            </View>
          </LinearGradient>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(client)/invoices' as any)}>
              <Ionicons name="receipt-outline" size={wp(18)} color={colors.orange[500]} />
              <Text style={styles.quickBtnText}>Factures</Text>
            </TouchableOpacity>
            <View style={styles.quickDivider} />
            <TouchableOpacity style={styles.quickBtn} onPress={handleCancel} disabled={cancelMutation.isPending}>
              <Ionicons name="close-circle-outline" size={wp(18)} color={colors.error[500]} />
              <Text style={[styles.quickBtnText, { color: colors.error[500] }]}>
                {cancelMutation.isPending ? 'Annulation…' : 'Annuler'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.heroPad}>
          <LinearGradient colors={[...colors.gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroNoBanner}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="diamond" size={wp(22)} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroActiveTitle}>Choisissez votre formule</Text>
              <Text style={styles.heroActiveDesc}>Réductions exclusives chez nos partenaires</Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* ── Tab switcher ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'main' && styles.tabItemActive]}
          onPress={() => setActiveTab('main')}
          activeOpacity={0.8}
        >
          {activeTab === 'main' ? (
            <LinearGradient colors={[...colors.gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabGradient}>
              <Ionicons name="qr-code" size={wp(15)} color="#FFF" />
              <Text style={styles.tabTextActive}>Formules</Text>
              {hasActiveSub && <View style={styles.tabActiveDot} />}
            </LinearGradient>
          ) : (
            <View style={styles.tabInner}>
              <Ionicons name="qr-code-outline" size={wp(15)} color={colors.neutral[500]} />
              <Text style={styles.tabText}>Formules</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'addon' && styles.tabItemAddonActive]}
          onPress={() => setActiveTab('addon')}
          activeOpacity={0.8}
        >
          {activeTab === 'addon' ? (
            <LinearGradient colors={['#FF6A00', '#FF8C42']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabGradient}>
              <Ionicons name="pricetag" size={wp(15)} color="#FFF" />
              <Text style={styles.tabTextActive}>Accès partenaires</Text>
              {addonSubs.length > 0 && <View style={styles.tabActiveDot} />}
            </LinearGradient>
          ) : (
            <View style={styles.tabInner}>
              <Ionicons name="pricetag-outline" size={wp(15)} color={colors.neutral[500]} />
              <Text style={styles.tabText}>Accès partenaires</Text>
              {addonSubs.length > 0 && <View style={[styles.tabDotInactive, { backgroundColor: '#FF6A00' }]} />}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Plans list (scrollable) ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing[6] }]}
        showsVerticalScrollIndicator={false}
        key={activeTab}
      >
        {/* ── ONGLET FORMULES ── */}
        {activeTab === 'main' && mainPlans.map((plan: any, idx: number) => {
          const isPopular = idx === 1;
          const isSelected = selectedPlan === plan.id;
          const isCurrentPlan = hasActiveSub && currentSub?.planCode === plan.code;
          const currentPlanObj = hasActiveSub ? mainPlans.find((p: any) => p.code === currentSub?.planCode) : null;
          const isUpgrade = currentPlanObj && (plan.tier ?? 0) > (currentPlanObj.tier ?? 0);
          const isDowngrade = currentPlanObj && (plan.tier ?? 0) < (currentPlanObj.tier ?? 0);
          const seats = plan.defaultSeats ?? 1;
          const planIcon = seats >= 3 ? 'people' : seats === 2 ? 'people-outline' : 'person';
          const btnTitle = hasActiveSub
            ? isUpgrade ? '↑ Passer au supérieur'
            : isDowngrade ? '↓ Réduire ma formule'
            : 'Changer de formule'
            : plan.trialDays ? `Essayer ${plan.trialDays} jours gratuitement`
            : "S'abonner";

          return (
            <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.9}
              disabled={changePlanMutation.isPending || checkoutMutation.isPending}>
              <View style={[
                styles.planCard,
                isSelected && styles.planSelected,
                isCurrentPlan && styles.planCurrent,
              ]}>
                {/* Gradient accent top bar */}
                {(isPopular || isCurrentPlan) && (
                  <LinearGradient
                    colors={isCurrentPlan ? [colors.success[400], colors.success[600]] : [...colors.gradients.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.planAccentBar}
                  />
                )}

                {/* Badge row */}
                <View style={styles.planBadgeRow}>
                  {isCurrentPlan && <MBadge label="✓ Votre formule" variant="success" size="sm" />}
                  {isPopular && !isCurrentPlan && <MBadge label="⭐ Populaire" variant="orange" size="sm" />}
                  {isUpgrade && !isCurrentPlan && <MBadge label="Upgrade" variant="orange" size="sm" />}
                </View>

                {/* Header: icon + name + price */}
                <View style={styles.planHeader}>
                  <View style={styles.planIconCircle}>
                    <Ionicons name={planIcon as any} size={wp(20)} color={colors.orange[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planSeats}>
                      {seats === 1 ? '1 personne' : seats === 2 ? '2 personnes' : `Jusqu'à ${seats} personnes`}
                    </Text>
                  </View>
                  <View style={styles.priceBlock}>
                    <Text style={styles.planPrice}>{formatPrice(plan.priceAmount ?? 0)}</Text>
                    <Text style={styles.planPeriod}>/mois</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.planDivider} />

                {/* Features */}
                <View style={styles.features}>
                  {[
                    plan.defaultPercent > 0 ? `Jusqu'à ${plan.defaultPercent}% de réduction` : null,
                    plan.trialDays ? `${plan.trialDays} jours d'essai gratuit` : null,
                    'Accès à tous les partenaires',
                    'QR code illimité',
                  ].filter(Boolean).map((feat, fi) => (
                    <View key={fi} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={wp(17)} color={colors.success[500]} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {!isCurrentPlan && (
                  <MButton title={btnTitle} onPress={() => handleSubscribe(plan)}
                    variant={isDowngrade ? 'outline' : 'primary'}
                    loading={selectedPlan === plan.id && (checkoutMutation.isPending || changePlanMutation.isPending || previewLoading)}
                    style={{ marginTop: spacing[4] }} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── ONGLET ACCÈS PARTENAIRES ── */}
        {activeTab === 'addon' && (
          <>
            {/* Active addons banner */}
            {addonSubs.length > 0 && (
              <View style={styles.addonActiveBanner}>
                {addonSubs.map((addon) => (
                  <View key={addon.id} style={styles.addonActivePill}>
                    <View style={styles.heroActiveDot} />
                    <Text style={styles.addonActivePillText}>{addon.planName ?? addon.planCode}</Text>
                    <Text style={styles.addonActivePillSub}>
                      {addon.expiresAt ? `exp. ${formatDate(addon.expiresAt)}` : 'actif'}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.addonPromoBtn}
                  onPress={() => router.push('/(client)/promo-codes' as any)} activeOpacity={0.8}>
                  <Ionicons name="pricetags-outline" size={wp(16)} color={colors.orange[500]} />
                  <Text style={styles.addonPromoBtnText}>Voir mes codes promo</Text>
                  <Ionicons name="chevron-forward" size={wp(14)} color={colors.neutral[300]} />
                </TouchableOpacity>
              </View>
            )}

            {addonPlansList.map((plan: any) => {
              const isSelected = selectedPlan === plan.id;
              const isCurrentAddon = addonSubs.some((a) => a.planCode === plan.code);
              const activeAddonSub = addonSubs.find((a) => a.planCode === plan.code);
              const btnTitle = plan.trialDays
                ? `Essayer ${plan.trialDays} jours gratuitement`
                : 'Ajouter cet accès';

              return (
                <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.9}
                  disabled={checkoutMutation.isPending}>
                  <View style={[styles.planCard, isSelected && styles.planSelected, isCurrentAddon && styles.planCurrent]}>
                    {isCurrentAddon && (
                      <LinearGradient colors={[colors.success[400], colors.success[600]]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.planAccentBar} />
                    )}

                    <View style={styles.planBadgeRow}>
                      {isCurrentAddon && <MBadge label="✓ Actif" variant="success" size="sm" />}
                    </View>

                    <View style={styles.planHeader}>
                      <View style={styles.planIconCircle}>
                        <Ionicons name="pricetag" size={wp(20)} color={colors.orange[500]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planSeats}>Codes promo exclusifs</Text>
                      </View>
                      <View style={styles.priceBlock}>
                        <Text style={styles.planPrice}>{formatPrice(plan.priceAmount ?? 0)}</Text>
                        <Text style={styles.planPeriod}>/mois</Text>
                      </View>
                    </View>

                    <View style={styles.planDivider} />

                    <View style={styles.features}>
                      {[
                        `Codes promo ${plan.name ?? plan.code} inclus`,
                        plan.trialDays ? `${plan.trialDays} jours d'essai gratuit` : null,
                        'Cumulable avec une formule QR code',
                      ].filter(Boolean).map((feat, fi) => (
                        <View key={fi} style={styles.featureRow}>
                          <Ionicons name="checkmark-circle" size={wp(17)} color={colors.success[500]} />
                          <Text style={styles.featureText}>{feat}</Text>
                        </View>
                      ))}
                      <View style={styles.featureRow}>
                        <Ionicons name="close-circle" size={wp(17)} color={colors.neutral[300]} />
                        <Text style={[styles.featureText, { color: 'rgba(255,255,255,0.3)' }]}>Accès QR code non inclus</Text>
                      </View>
                    </View>

                    {isCurrentAddon && activeAddonSub?.expiresAt && (
                      <View style={styles.addonExpiry}>
                        <Ionicons name="time-outline" size={wp(13)} color={colors.neutral[400]} />
                        <Text style={styles.addonExpiryText}>Expire le {formatDate(activeAddonSub.expiresAt)}</Text>
                      </View>
                    )}

                    {!isCurrentAddon && (
                      <MButton title={btnTitle} onPress={() => handleSubscribe(plan)} variant="primary"
                        loading={selectedPlan === plan.id && checkoutMutation.isPending}
                        style={{ marginTop: spacing[4] }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {addonPlansList.length === 0 && (
              <View style={styles.emptyTab}>
                <Ionicons name="pricetag-outline" size={wp(40)} color={colors.neutral[300]} />
                <Text style={styles.emptyTabText}>Aucun accès partenaire disponible</Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.finePrint}>
          En vous abonnant, vous acceptez nos conditions générales d'utilisation.{'\n'}
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
              <LinearGradient colors={['#FF6A00', '#FF8C42']} style={mStyles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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

  /* Hero pad */
  heroPad: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.orange[50],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.orange[100],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  heroIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
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
    marginTop: 1,
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
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
    ...shadows.sm,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  quickBtnText: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.orange[600],
  },
  quickDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[100],
  },
  heroNoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  heroNoBannerTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: '#FFF',
  },
  heroNoBannerSub: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  /* Tab switcher */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius['2xl'],
    padding: spacing[1],
    gap: spacing[1],
  },
  tabItem: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  tabItemActive: {},
  tabItemAddonActive: {},
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.xl,
  },
  tabText: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[500],
  },
  tabTextActive: {
    ...textStyles.caption,
    fontFamily: fontFamily.bold,
    color: '#FFF',
  },
  tabActiveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  tabDotInactive: {
    width: 6, height: 6, borderRadius: 3,
  },
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: spacing[3],
  },
  emptyTabText: {
    ...textStyles.body,
    color: colors.neutral[400],
  },

  /* ── Active addons banner (inside main section) ── */
  addonActiveBanner: {
    backgroundColor: '#FFF7F0',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  addonActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FFE4CC',
  },
  addonActivePillText: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: '#CC4B00',
    flex: 1,
  },
  addonActivePillSub: {
    ...textStyles.micro,
    color: '#FF6A00',
  },
  addonPromoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    backgroundColor: colors.orange[50],
  },
  addonPromoBtnText: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.orange[600],
    flex: 1,
  },

  /* ── Addon plan cards ── */
  addonPlanCard: {
    backgroundColor: '#1E1B2E',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6A00',
  },
  addonPlanSelected: {
    borderWidth: 2,
    borderColor: '#FF6A00',
    borderLeftWidth: 2,
  },
  addonPlanCurrent: {
    borderWidth: 2,
    borderColor: colors.success[500],
    borderLeftWidth: 2,
    opacity: 0.85,
  },
  addonPlanNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  addonPlanIconSmall: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonPlanBtn: {
    borderColor: '#FF6A00',
  },
  addonExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  addonExpiryText: {
    ...textStyles.micro,
    color: colors.neutral[400],
  },

  /* ── Hero active banner ── */
  heroActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  heroActiveTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: '#FFF',
  },
  heroActiveDesc: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroActiveDotWrap: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Plan cards ── */
  planCard: {
    backgroundColor: '#1A1F2E',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing[4],
    overflow: 'hidden',
    ...shadows.sm,
  },
  planSelected: {
    borderColor: colors.orange[400],
    borderWidth: 2,
  },
  planCurrent: {
    borderColor: colors.success[400],
    borderWidth: 2,
  },
  planAccentBar: {
    height: 4,
    width: '100%',
  },
  planBadgeRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2],
    minHeight: spacing[4],
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    gap: spacing[3],
  },
  planIconCircle: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(255,106,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  planName: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  planSeats: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  planPrice: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  planPeriod: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.4)',
  },
  planDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  features: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  featureText: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
  finePrint: {
    ...textStyles.micro,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing[4],
    lineHeight: 16,
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
