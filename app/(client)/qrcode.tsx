/**
 * Maya Connect V2 — QR Code Screen (Client)
 *
 * Requires:
 *  1. Profile photo uploaded
 *  2. Active subscription
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../src/stores/auth.store';
import { qrApi } from '../../src/api/qr.api';
import { subscriptionsApi } from '../../src/api/subscriptions.api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatName } from '../../src/utils/format';
import { MAvatar, MBadge, MButton } from '../../src/components/ui';
import { QR_CONFIG } from '../../src/constants/config';

const QR_SIZE = wp(240);
const QR_ZOOM_SIZE = wp(300);

export default function QrCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [showZoom, setShowZoom] = useState(false);
  const [showAvatarZoom, setShowAvatarZoom] = useState(false);

  const hasAvatar = !!user?.avatarUrl;

  const subQuery = useQuery({
    queryKey: ['hasSubscription'],
    queryFn: () => subscriptionsApi.hasSubscription(),
    select: (res) => res.data.hasSubscription,
    staleTime: 60_000,
  });

  const mySubQuery = useQuery({
    queryKey: ['mySubscription'],
    queryFn: () => subscriptionsApi.getMySubscription(),
    select: (res) => res.data,
    staleTime: 60_000,
    enabled: !!subQuery.data,
  });

  const hasSubscription = subQuery.data ?? false;
  const subLoading = subQuery.isLoading;

  const qrQuery = useQuery({
    queryKey: ['qrToken'],
    queryFn: () => qrApi.issueToken(),
    select: (res) => res.data,
    refetchInterval: QR_CONFIG.refreshInterval,
    staleTime: 0, // Always refetch on mount/focus to get fresh token after transaction
    retry: 3,
    enabled: hasAvatar && hasSubscription,
  });

  // Refetch QR token when app returns to foreground (e.g., after a transaction is validated)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && hasAvatar && hasSubscription) {
        qrQuery.refetch();
      }
    });
    return () => sub.remove();
  }, [hasAvatar, hasSubscription]);

  const qrToken = qrQuery.data?.token;
  const hasError = qrQuery.isError;

  // ── Gate screen si conditions non remplies ──
  if (subLoading) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.orange[500]} />
      </View>
    );
  }

  if (!hasAvatar || !hasSubscription) {
    return <GateScreen hasAvatar={hasAvatar} hasSubscription={hasSubscription} />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + spacing[3] }]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Présentez ce code au commerçant{'\n'}pour bénéficier de votre réduction
        </Text>

        {/* QR Card */}
        <View style={styles.card}>
          <View style={styles.userRow}>
            <TouchableOpacity
              activeOpacity={user?.avatarUrl ? 0.8 : 1}
              onPress={() => user?.avatarUrl && setShowAvatarZoom(true)}
            >
              <MAvatar
                uri={user?.avatarUrl}
                name={formatName(user?.firstName, user?.lastName)}
                size="sm"
              />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {formatName(user?.firstName, user?.lastName)}
              </Text>
              <MBadge label="Client Maya" variant="orange" size="sm" />
            </View>
            {mySubQuery.data && (
              <View style={styles.subBox}>
                <View style={styles.subIconRow}>
                  <Ionicons name="diamond" size={wp(11)} color={colors.orange[400]} />
                  <Text style={styles.subPlan} numberOfLines={1}>
                    {mySubQuery.data.planCode ?? 'Abonnement'}
                  </Text>
                </View>
                {mySubQuery.data.expiresAt && (
                  <Text style={styles.subExpiry} numberOfLines={1}>
                    Exp. {new Date(mySubQuery.data.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.qrZone}>
            {qrQuery.isLoading ? (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="large" color={colors.orange[500]} />
                <Text style={styles.loadingText}>Génération du QR code…</Text>
              </View>
            ) : qrToken ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowZoom(true)}>
                <View style={styles.qrBox}>
                  <QRCode
                    value={qrToken}
                    size={QR_SIZE}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            ) : hasError ? (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="wifi-outline" size={40} color={colors.error[500]} />
                <Text style={styles.errorTitle}>Connexion impossible</Text>
                <Text style={styles.errorText}>
                  Impossible de générer le QR code.{'\n'}Vérifiez votre connexion.
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => qrQuery.refetch()}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {qrToken && (
            <Text style={styles.instructions}>
              Code unique · Se rafraîchit automatiquement · Valable pour une transaction
            </Text>
          )}
        </View>

        <View style={styles.tipRow}>
          <Ionicons name="sunny-outline" size={18} color={colors.orange[500]} />
          <Text style={styles.tipText}>
            Augmentez la luminosité de l'écran pour faciliter le scan
          </Text>
        </View>
        <View style={[styles.tipRow, { marginTop: spacing[2] }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.violet[500]} />
          <Text style={styles.tipText}>
            Ce code est sécurisé et lié à votre compte
          </Text>
        </View>
      </ScrollView>

      {/* Avatar Zoom Modal */}
      <Modal visible={showAvatarZoom} transparent animationType="fade" onRequestClose={() => setShowAvatarZoom(false)} statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAvatarZoom(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Image source={{ uri: user?.avatarUrl }} style={styles.avatarZoomImage} resizeMode="cover" />
          </Pressable>
        </Pressable>
      </Modal>

      {/* QR Zoom Modal */}
      <Modal visible={showZoom} transparent animationType="fade" onRequestClose={() => setShowZoom(false)} statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowZoom(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <View style={styles.qrBoxZoom}>
                {qrToken ? (
                  <QRCode value={qrToken} size={QR_ZOOM_SIZE} color="#0F172A" backgroundColor="#FFFFFF" />
                ) : null}
              </View>
              <Text style={styles.modalHint}>Appuyez en dehors pour fermer</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ── Gate Screen ── */
function GateScreen({ hasAvatar, hasSubscription }: { hasAvatar: boolean; hasSubscription: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const steps = [
    {
      done: hasAvatar,
      icon: 'camera' as const,
      title: 'Photo de profil',
      description: 'Ajoutez une photo pour identifier votre compte.',
      actionLabel: 'Ajouter une photo',
      onAction: () => router.push('/(client)/profile'),
    },
    {
      done: hasSubscription,
      icon: 'diamond' as const,
      title: 'Abonnement actif',
      description: 'Souscrivez à un abonnement Maya pour accéder à vos réductions.',
      actionLabel: 'Voir les offres',
      onAction: () => router.push('/(client)/subscription'),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gateHeader}
      >
        <View style={styles.gateLockWrap}>
          <View style={styles.gateLock}>
            <Ionicons name="lock-closed" size={wp(32)} color={colors.orange[500]} />
          </View>
        </View>
        <Text style={styles.gateTitle}>QR Code verrouillé</Text>
        <Text style={styles.gateSubtitle}>
          Complétez les étapes ci-dessous{'\n'}pour accéder à votre QR Code
        </Text>

        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: completedCount }]} />
          <View style={[styles.progressEmpty, { flex: steps.length - completedCount }]} />
        </View>
        <Text style={styles.progressLabel}>{completedCount}/{steps.length} étapes complétées</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.gateContent, { paddingBottom: insets.bottom + wp(100) }]}
        showsVerticalScrollIndicator={false}
      >
        {steps.map((step, idx) => (
          <View key={idx} style={[styles.stepCard, step.done && styles.stepCardDone]}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepIconBox, step.done ? styles.stepIconDone : styles.stepIconPending]}>
                {step.done ? (
                  <Ionicons name="checkmark" size={wp(18)} color="#FFFFFF" />
                ) : (
                  <Ionicons name={step.icon} size={wp(18)} color={colors.orange[500]} />
                )}
              </View>
              <View style={styles.stepInfo}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepTitle, step.done && styles.stepTitleDone]}>
                    {step.title}
                  </Text>
                  {step.done && (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>Complété</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepDesc}>{step.description}</Text>
              </View>
            </View>
            {!step.done && (
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={step.onAction}
                activeOpacity={0.8}
              >
                <Text style={styles.stepBtnText}>{step.actionLabel}</Text>
                <Ionicons name="arrow-forward" size={wp(14)} color={colors.orange[500]} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.gateTip}>
          <Ionicons name="information-circle-outline" size={wp(18)} color="rgba(255,255,255,0.4)" />
          <Text style={styles.gateTipText}>
            Ces étapes garantissent la sécurité de votre compte et l'accès aux réductions partenaires.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  center: { alignItems: 'center', justifyContent: 'center' },

  backBtn: {
    position: 'absolute',
    left: spacing[5],
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // ── Content ──
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  subtitle: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 22,
  },

  // ── Card ──
  card: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    ...shadows.xl,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[5] },
  userInfo: { marginLeft: spacing[3], flex: 1 },
  userName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
    marginBottom: spacing[1],
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: spacing[6] },

  subBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  subIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: 2,
  },
  subPlan: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: colors.orange[300],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subExpiry: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.4)',
    fontSize: wp(9),
  },

  // ── QR ──
  qrZone: { alignItems: 'center' },
  qrBox: { backgroundColor: '#FFFFFF', borderRadius: borderRadius.xl, padding: spacing[4] },
  qrPlaceholder: {
    width: QR_SIZE + spacing[4] * 2,
    minHeight: QR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[6],
  },
  loadingText: { ...textStyles.caption, color: 'rgba(255,255,255,0.45)', marginTop: spacing[3] },
  errorTitle: { ...textStyles.bodyBold, color: '#FFFFFF', marginTop: spacing[3], marginBottom: spacing[2] },
  errorText: { ...textStyles.caption, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.orange[500],
  },
  retryText: { ...textStyles.caption, color: colors.orange[500], fontFamily: fontFamily.semiBold },
  instructions: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: spacing[5],
    lineHeight: 18,
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: { alignItems: 'center', gap: spacing[4] },
  qrBoxZoom: { backgroundColor: '#FFFFFF', borderRadius: borderRadius.xl, padding: spacing[5] },
  modalHint: { ...textStyles.caption, color: 'rgba(255,255,255,0.45)' },
  avatarZoomImage: {
    width: wp(300),
    height: wp(300),
    borderRadius: wp(150),
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },

  // ── Tips ──
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[5],
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    gap: spacing[3],
  },
  tipText: { ...textStyles.caption, color: 'rgba(255,255,255,0.5)', flex: 1, lineHeight: 18 },

  // ── Gate Screen ──
  gateHeader: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },
  gateLockWrap: { marginBottom: spacing[4] },
  gateLock: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: 'rgba(251,146,60,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251,146,60,0.25)',
  },
  gateTitle: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: spacing[2],
  },
  gateSubtitle: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[5],
  },
  progressBar: {
    flexDirection: 'row',
    height: wp(6),
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  progressFill: { backgroundColor: colors.orange[500], borderRadius: borderRadius.full },
  progressEmpty: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.full },
  progressLabel: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.4)',
  },

  gateContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[3],
  },
  stepCard: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  stepCardDone: {
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  stepLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  stepIconBox: {
    width: wp(42),
    height: wp(42),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepIconPending: { backgroundColor: 'rgba(251,146,60,0.12)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.25)' },
  stepIconDone: { backgroundColor: colors.success[500] },
  stepInfo: { flex: 1 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  stepTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  stepTitleDone: { color: 'rgba(255,255,255,0.6)' },
  stepDesc: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },
  doneBadge: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  doneBadgeText: {
    ...textStyles.micro,
    color: colors.success[500],
    fontFamily: fontFamily.semiBold,
  },
  stepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
    alignSelf: 'flex-end',
  },
  stepBtnText: {
    ...textStyles.caption,
    color: colors.orange[500],
    fontFamily: fontFamily.semiBold,
  },

  gateTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginTop: spacing[2],
  },
  gateTipText: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.35)',
    flex: 1,
    lineHeight: 18,
  },
});
