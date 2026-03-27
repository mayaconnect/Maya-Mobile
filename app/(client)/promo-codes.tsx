/**
 * Maya Connect V2 — Client Promo Codes Screen
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { promoCodesApi } from '../../src/api/promo-codes.api';
import type { PartnerPromoCodeDto } from '../../src/types';
import { borderRadius, shadows, spacing } from '../../src/theme/spacing';
import { fontFamily, textStyles } from '../../src/theme/typography';
import { clientColors as colors } from '../../src/theme/colors';
import { wp } from '../../src/utils/responsive';
import { formatDate } from '../../src/utils/format';
import { MButton, MModal, LoadingSpinner, ErrorState } from '../../src/components/ui';

/* ─────────────────────────────────────────────────────────────── */

export default function ClientPromoCodesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { planCode: filterPlanCode } = useLocalSearchParams<{ planCode?: string }>();

  const [pendingMarkUsed, setPendingMarkUsed] = useState<PartnerPromoCodeDto | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [revealedCodeKeys, setRevealedCodeKeys] = useState<Set<string>>(() => new Set());

  const getPromoCodeKey = (item: PartnerPromoCodeDto) => `${(item as any).promoCodeId ?? item.id ?? 'no-id'}:${item.code}`;
  const maskPromoCode = (raw: string) => raw.replace(/./g, '*');
  const toggleRevealCode = (key: string) => {
    setRevealedCodeKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const codesQ = useQuery({
    queryKey: ['myPromoCodes'],
    queryFn: () => promoCodesApi.getMyPromoCodes(),
    select: (res) => res.data ?? [],
  });

  const markUsedMutation = useMutation({
    mutationFn: (id: string) => promoCodesApi.markUsed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPromoCodes'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingMarkUsed(null);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? err?.response?.data?.title ?? err?.message;
      Alert.alert('Erreur', detail ?? 'Impossible de marquer ce code comme utilisé.');
      setPendingMarkUsed(null);
    },
  });

  const handleCopy = async (item: PartnerPromoCodeDto) => {
    await Clipboard.setStringAsync(item.code);
    setCopiedCodeKey(getPromoCodeKey(item));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedCodeKey(null), 2000);
  };

  const getPromoCodeId = (item: PartnerPromoCodeDto) => (item as any).promoCodeId ?? item.id;

  // Reset affichage des codes quand on change de plan filtré
  useEffect(() => {
    setRevealedCodeKeys(new Set());
    setCopiedCodeKey(null);
  }, [filterPlanCode]);

  const allCodes = codesQ.data ?? [];
  const codes = filterPlanCode
    ? allCodes.filter(
        (c) =>
          c.partnerName?.toLowerCase().includes(filterPlanCode.toLowerCase()) ||
          (c as any).planCode === filterPlanCode,
      )
    : allCodes;
  const available = codes.filter((c) => !c.isUsed);
  const used = codes.filter((c) => c.isUsed);
  const pageTitle = filterPlanCode
    ? (allCodes.find((c) => (c as any).planCode === filterPlanCode)?.partnerName ?? filterPlanCode)
    : 'Mes codes promo';

  if (codesQ.isLoading) {
    return (
      <View style={styles.centered}>
        <LoadingSpinner />
      </View>
    );
  }

  if (codesQ.isError) {
    return (
      <View style={styles.centered}>
        <ErrorState
          title="Erreur"
          message="Impossible de récupérer vos codes promo."
          onRetry={() => codesQ.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Hero Header ── */}
      <LinearGradient
        colors={['#FF6A00', '#FF8C42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing[3] }]}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={wp(22)} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{pageTitle}</Text>
          <View style={{ width: wp(38) }} />
        </View>

        {codes.length > 0 && (
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{available.length}</Text>
              <Text style={styles.heroStatLabel}>Disponibles</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{used.length}</Text>
              <Text style={styles.heroStatLabel}>Utilisés</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{codes.length}</Text>
              <Text style={styles.heroStatLabel}>Total</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {codes.length === 0 ? (
          <EmptyState onSubscribe={() => router.push('/(client)/subscription' as any)} />
        ) : (
          <>
            {/* ── Available codes ── */}
            {available.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Disponibles</Text>
                </View>
                {available.map((item) => (
                  (() => {
                    const codeKey = getPromoCodeKey(item);
                    return (
                  <PromoCodeCard
                    key={codeKey}
                    item={item}
                    codeKey={codeKey}
                    isCopied={copiedCodeKey === codeKey}
                    isRevealed={revealedCodeKeys.has(codeKey)}
                    onToggleReveal={() => toggleRevealCode(codeKey)}
                    onCopy={() => handleCopy(item)}
                    onMarkUsed={() => setPendingMarkUsed(item)}
                  />
                    );
                  })()
                ))}
              </View>
            )}

            {/* ── Used codes ── */}
            {used.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: colors.neutral[300] }]} />
                  <Text style={styles.sectionTitle}>Utilisés</Text>
                </View>
                {used.map((item) => (
                  (() => {
                    const codeKey = getPromoCodeKey(item);
                    return (
                  <PromoCodeCard
                    key={codeKey}
                    item={item}
                    codeKey={codeKey}
                    isCopied={copiedCodeKey === codeKey}
                    isRevealed={revealedCodeKeys.has(codeKey)}
                    onToggleReveal={() => toggleRevealCode(codeKey)}
                    onCopy={() => handleCopy(item)}
                    onMarkUsed={() => {}}
                    disabled
                  />
                    );
                  })()
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Confirm mark-used modal ── */}
      <MModal
        visible={!!pendingMarkUsed}
        onClose={() => setPendingMarkUsed(null)}
        title="Marquer comme utilisé"
      >
        <View style={styles.modalBody}>
          <View style={styles.modalCodeDisplay}>
            <Text style={styles.modalCodeValue}>{pendingMarkUsed?.code}</Text>
          </View>
          <Text style={styles.modalText}>
            Ce code sera marqué comme consommé et ne pourra plus être utilisé.
          </Text>
        </View>
        <View style={styles.modalActions}>
          <MButton
            title="Annuler"
            variant="outline"
            onPress={() => setPendingMarkUsed(null)}
            style={{ flex: 1 }}
          />
          <MButton
            title="Confirmer"
            onPress={() => {
              const promoCodeId = getPromoCodeId(pendingMarkUsed!);
              if (!promoCodeId) {
                Alert.alert('Erreur', 'Identifiant du code promo introuvable.');
                return;
              }
              markUsedMutation.mutate(promoCodeId);
            }}
            loading={markUsedMutation.isPending}
            style={{ flex: 1 }}
          />
        </View>
      </MModal>
    </View>
  );
}

/* ── PromoCodeCard ── */
function PromoCodeCard({
  item,
  codeKey,
  isCopied,
  isRevealed,
  onToggleReveal,
  onCopy,
  onMarkUsed,
  disabled = false,
}: {
  item: PartnerPromoCodeDto;
  codeKey: string;
  isCopied: boolean;
  isRevealed: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  onMarkUsed: () => void;
  disabled?: boolean;
}) {
  const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
  const maskPromoCode = (raw: string) => raw.replace(/./g, '*');

  return (
    <View style={[cardStyles.card, disabled && cardStyles.cardUsed]}>
      {/* Top accent bar */}
      {!disabled && !isExpired && (
        <LinearGradient
          colors={['#FF6A00', '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={cardStyles.accentBar}
        />
      )}

      {/* ── Partner row ── */}
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.partnerIcon, disabled && cardStyles.partnerIconUsed]}>
          <Ionicons
            name="pricetag"
            size={wp(17)}
            color={disabled ? colors.neutral[400] : '#FF6A00'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.partnerName, disabled && cardStyles.textMuted]}>
            {item.partnerName ?? 'Partenaire'}
          </Text>
          {item.description ? (
            <Text style={cardStyles.description} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        {item.isUsed ? (
          <View style={cardStyles.statusBadgeUsed}>
            <Ionicons name="checkmark-circle" size={wp(12)} color={colors.neutral[400]} />
            <Text style={cardStyles.statusTextUsed}>Utilisé</Text>
          </View>
        ) : isExpired ? (
          <View style={cardStyles.statusBadgeExpired}>
            <Ionicons name="close-circle" size={wp(12)} color={colors.error[500]} />
            <Text style={cardStyles.statusTextExpired}>Expiré</Text>
          </View>
        ) : (
          <View style={cardStyles.statusBadgeActive}>
            <View style={cardStyles.activeDot} />
            <Text style={cardStyles.statusTextActive}>Actif</Text>
          </View>
        )}
      </View>

      {/* ── Discount + Code ── */}
      <View style={cardStyles.codeSection}>
        {(item.discountPercent || item.discountAmount) && (
          <View style={[cardStyles.discountBadge, disabled && cardStyles.discountBadgeUsed]}>
            <Text style={[cardStyles.discountText, disabled && cardStyles.discountTextUsed]}>
              {item.discountPercent ? `-${item.discountPercent}%` : `-${item.discountAmount}€`}
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          style={{ width: '100%' }}
          onPress={onToggleReveal}
        >
          <View style={[cardStyles.codeBox, disabled && cardStyles.codeBoxUsed]}>
            <Text
              style={[
                cardStyles.codeValue,
                disabled && isRevealed ? cardStyles.codeValueUsed : null,
                !isRevealed ? cardStyles.codeValueHidden : null,
              ]}
            >
              {isRevealed ? item.code : maskPromoCode(item.code)}
            </Text>
            <View style={cardStyles.revealRow}>
              <Ionicons
                name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                size={wp(14)}
                color={isRevealed ? colors.orange[500] : colors.neutral[400]}
              />
              <Text style={[cardStyles.revealText, !isRevealed && cardStyles.revealTextHidden]}>
                {isRevealed ? 'Cacher' : 'Dévoiler'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Copy CTA ── */}
      {!disabled && !isExpired ? (
        <TouchableOpacity onPress={onCopy} activeOpacity={0.85} style={cardStyles.copyBtnWrap}>
          {isCopied ? (
            <View style={cardStyles.copyBtnSuccess}>
              <Ionicons name="checkmark-circle" size={wp(17)} color={colors.success[500]} />
              <Text style={cardStyles.copyBtnTextSuccess}>Code copié !</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#FF6A00', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={cardStyles.copyBtnGradient}
            >
              <Ionicons name="copy-outline" size={wp(16)} color="#FFF" />
              <Text style={cardStyles.copyBtnText}>Copier le code</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      ) : disabled ? (
        <View style={cardStyles.usedCopyRow}>
          <Ionicons name="copy-outline" size={wp(14)} color={colors.neutral[300]} />
          <Text style={cardStyles.usedCopyText}>Code déjà utilisé</Text>
        </View>
      ) : null}

      {/* ── Footer ── */}
      <View style={cardStyles.footer}>
        <View style={cardStyles.footerLeft}>
          {item.expiresAt && !item.isUsed ? (
            <>
              <Ionicons
                name="time-outline"
                size={wp(12)}
                color={isExpired ? colors.error[400] : colors.neutral[400]}
              />
              <Text style={[cardStyles.footerText, isExpired && cardStyles.footerTextExpired]}>
                {isExpired ? 'Expiré le' : 'Expire le'} {formatDate(item.expiresAt)}
              </Text>
            </>
          ) : item.usedAt ? (
            <>
              <Ionicons name="checkmark-circle-outline" size={wp(12)} color={colors.neutral[400]} />
              <Text style={cardStyles.footerText}>Utilisé le {formatDate(item.usedAt)}</Text>
            </>
          ) : (
            <>
              <Ionicons name="calendar-outline" size={wp(12)} color={colors.neutral[400]} />
              <Text style={cardStyles.footerText}>Reçu le {formatDate(item.createdAt)}</Text>
            </>
          )}
        </View>

        {!disabled && !isExpired && (
          <TouchableOpacity style={cardStyles.markUsedBtn} onPress={onMarkUsed} activeOpacity={0.7}>
            <Text style={cardStyles.markUsedText}>Marquer utilisé</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ── EmptyState ── */
function EmptyState({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <LinearGradient
        colors={['#FF6A00', '#FF8C42']}
        style={emptyStyles.iconWrap}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="pricetags-outline" size={wp(36)} color="#FFF" />
      </LinearGradient>
      <Text style={emptyStyles.title}>Aucun code promo</Text>
      <Text style={emptyStyles.subtitle}>
        Les codes promo sont réservés aux accès{' '}
        <Text style={emptyStyles.bold}>Shotgun</Text> et{' '}
        <Text style={emptyStyles.bold}>Sunbed</Text>.{'\n\n'}
        Votre abonnement Solo/Duo/Famille vous donne accès au{' '}
        <Text style={emptyStyles.bold}>QR code</Text>, pas aux codes promo.
      </Text>
      <MButton
        title="Ajouter un accès Shotgun / Sunbed"
        onPress={onSubscribe}
        style={emptyStyles.btn}
      />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },

  /* Hero */
  hero: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing[4],
  },
  backBtn: {
    width: wp(38),
    height: wp(38),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: wp(17),
    fontFamily: fontFamily.bold,
    color: '#FFF',
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  heroStatValue: {
    fontSize: wp(22),
    fontFamily: fontFamily.bold,
    color: '#FFF',
  },
  heroStatLabel: {
    fontSize: wp(10),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatDivider: {
    width: 1,
    height: wp(30),
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  /* Scroll */
  scroll: {
    padding: spacing[4],
    gap: spacing[4],
  },
  section: { gap: spacing[3] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginLeft: spacing[1],
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6A00',
  },
  sectionTitle: {
    fontSize: wp(11),
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* Modal */
  modalBody: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  modalCodeDisplay: {
    backgroundColor: colors.orange[50],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.orange[200],
    borderStyle: 'dashed',
  },
  modalCodeValue: {
    fontSize: wp(20),
    fontFamily: fontFamily.bold,
    color: colors.orange[600],
    letterSpacing: 2,
  },
  modalText: {
    fontSize: wp(13),
    fontFamily: fontFamily.regular,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: wp(19),
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1F2E',
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    ...shadows.sm,
  },
  cardUsed: {
    opacity: 0.55,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },

  /* Partner row */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  partnerIcon: {
    width: wp(38),
    height: wp(38),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,106,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  partnerIconUsed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  partnerName: {
    fontSize: wp(14),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  textMuted: {
    color: 'rgba(255,255,255,0.4)',
  },
  description: {
    fontSize: wp(11),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },

  /* Status badges */
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success[400],
  },
  statusTextActive: {
    fontSize: wp(10),
    fontFamily: fontFamily.semiBold,
    color: colors.success[400],
  },
  statusBadgeUsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusTextUsed: {
    fontSize: wp(10),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.35)',
  },
  statusBadgeExpired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  statusTextExpired: {
    fontSize: wp(10),
    fontFamily: fontFamily.medium,
    color: colors.error[400],
  },

  /* Discount + Code */
  codeSection: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  discountBadge: {
    backgroundColor: 'rgba(255,106,0,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.4)',
  },
  discountBadgeUsed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  discountText: {
    fontSize: wp(13),
    fontFamily: fontFamily.bold,
    color: '#FF8C42',
    letterSpacing: 0.5,
  },
  discountTextUsed: {
    color: 'rgba(255,255,255,0.3)',
  },
  codeBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,106,0,0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,106,0,0.06)',
  },
  codeBoxUsed: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  codeValue: {
    fontSize: wp(24),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  codeValueHidden: {
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2,
  },
  codeValueUsed: {
    color: 'rgba(255,255,255,0.25)',
    textDecorationLine: 'line-through',
    letterSpacing: 1,
  },
  revealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  revealText: {
    ...textStyles.caption,
    fontFamily: fontFamily.bold,
    color: colors.orange[500],
  },
  revealTextHidden: {
    color: colors.neutral[400],
  },

  /* Copy CTA */
  copyBtnWrap: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  copyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  copyBtnText: {
    fontSize: wp(14),
    fontFamily: fontFamily.bold,
    color: '#FFF',
  },
  copyBtnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  copyBtnTextSuccess: {
    fontSize: wp(14),
    fontFamily: fontFamily.bold,
    color: colors.success[400],
  },
  usedCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.xl,
  },
  usedCopyText: {
    fontSize: wp(13),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.2)',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  footerText: {
    fontSize: wp(11),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.35)',
  },
  footerTextExpired: {
    color: colors.error[400],
  },
  markUsedBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.3)',
    backgroundColor: 'rgba(255,106,0,0.08)',
  },
  markUsedText: {
    fontSize: wp(11),
    fontFamily: fontFamily.medium,
    color: '#FF8C42',
  },
});

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: wp(60),
    gap: spacing[4],
    paddingHorizontal: spacing[6],
  },
  iconWrap: {
    width: wp(88),
    height: wp(88),
    borderRadius: wp(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: wp(18),
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: wp(13),
    fontFamily: fontFamily.regular,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: wp(19),
  },
  bold: {
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[800],
  },
  btn: {
    marginTop: spacing[2],
    alignSelf: 'stretch',
  },
});
