/**
 * Maya Connect V2 — Client Invoices Screen  (redesigned)
 *
 * Dark theme, card list with orange accents, tap-to-view detail modal,
 * native Share workaround while PDF generation is not yet supported.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { LoadingSpinner, ErrorState } from '../../src/components/ui';
import { paymentsApi } from '../../src/api/subscriptions.api';
import type { InvoiceDto } from '../../src/types';

/* ─── Helpers ─── */
const formatPrice = (amount: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/* ─── Status config ─── */
const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  Paid:      { label: 'Payée',     color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',   dot: '#4ADE80' },
  Issued:    { label: 'Émise',     color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  dot: '#FBBF24' },
  Overdue:   { label: 'En retard', color: '#F87171', bg: 'rgba(248,113,113,0.12)', dot: '#F87171' },
  Cancelled: { label: 'Annulée',   color: '#94A3B8', bg: 'rgba(148,163,184,0.12)',dot: '#94A3B8' },
};
const getStatus = (s: string) => STATUS[s] ?? STATUS.Issued;

/* ─── Native Share workaround ─── */
const shareInvoice = async (invoice: InvoiceDto) => {
  const total = invoice.amount + invoice.taxAmount;
  const st = getStatus(invoice.status);
  const body = [
    `📄 Facture Maya Connect`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `Numéro : ${invoice.number || invoice.id.slice(0, 8).toUpperCase()}`,
    `Date   : ${formatDate(invoice.createdAt)}`,
    `Statut : ${st.label}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    invoice.taxAmount > 0
      ? `Montant HT : ${formatPrice(invoice.amount, invoice.currency)}\nTVA        : ${formatPrice(invoice.taxAmount, invoice.currency)}\nTotal TTC  : ${formatPrice(total, invoice.currency)}`
      : `Montant : ${formatPrice(total, invoice.currency)}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `Maya Connect — votre programme de fidélité`,
  ].join('\n');

  try {
    await Share.share({ message: body, title: `Facture ${invoice.number || invoice.id.slice(0, 8)}` });
  } catch { /* user dismissed */ }
};

/* ════════════════════════════════════════════════════════════════ */
/*  Invoice Detail Modal                                             */
/* ════════════════════════════════════════════════════════════════ */
function InvoiceModal({ invoice, onClose }: { invoice: InvoiceDto | null; onClose: () => void }) {
  if (!invoice) return null;
  const total = invoice.amount + invoice.taxAmount;
  const st = getStatus(invoice.status);

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={mStyles.backdrop} onPress={onClose} />
      <View style={mStyles.sheet}>
        <View style={mStyles.handle} />

        {/* Receipt gradient header */}
        <LinearGradient
          colors={['#FF6A00', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={mStyles.receiptHeader}
        >
          <View style={mStyles.receiptIconWrap}>
            <Ionicons name="receipt" size={wp(32)} color="#FFFFFF" />
          </View>
          <Text style={mStyles.receiptTitle}>Facture</Text>
          <Text style={mStyles.receiptNumber}>
            {invoice.number || `#${invoice.id.slice(0, 8).toUpperCase()}`}
          </Text>
          <View style={[mStyles.statusPill, { backgroundColor: st.bg }]}>
            <View style={[mStyles.statusDot, { backgroundColor: st.dot }]} />
            <Text style={[mStyles.statusPillText, { color: st.color }]}>{st.label}</Text>
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={mStyles.body}>
          {/* Date */}
          <View style={mStyles.metaRow}>
            <View style={mStyles.metaItem}>
              <Ionicons name="calendar-outline" size={wp(14)} color="rgba(255,255,255,0.4)" />
              <Text style={mStyles.metaLabel}>Date d'émission</Text>
            </View>
            <Text style={mStyles.metaValue}>{formatDate(invoice.createdAt)}</Text>
          </View>

          <View style={mStyles.divider} />

          {/* Amounts */}
          <View style={mStyles.amountTable}>
            {invoice.taxAmount > 0 ? (
              <>
                <View style={mStyles.amountRow}>
                  <Text style={mStyles.amountLabel}>Montant HT</Text>
                  <Text style={mStyles.amountVal}>{formatPrice(invoice.amount, invoice.currency)}</Text>
                </View>
                <View style={mStyles.amountRow}>
                  <Text style={mStyles.amountLabel}>TVA</Text>
                  <Text style={mStyles.amountVal}>{formatPrice(invoice.taxAmount, invoice.currency)}</Text>
                </View>
                <View style={mStyles.totalSep} />
              </>
            ) : null}
            <View style={mStyles.amountRow}>
              <Text style={mStyles.totalKey}>Total TTC</Text>
              <Text style={mStyles.totalAmount}>{formatPrice(total, invoice.currency)}</Text>
            </View>
          </View>

          <View style={mStyles.divider} />

          {/* Workaround note */}
          <View style={mStyles.noteRow}>
            <Ionicons name="information-circle-outline" size={wp(14)} color="rgba(255,255,255,0.3)" />
            <Text style={mStyles.noteText}>
              Partagez cette facture ou prenez une capture d'écran pour la conserver.
            </Text>
          </View>

          {/* Actions */}
          <View style={mStyles.actions}>
            <TouchableOpacity style={mStyles.shareBtn} onPress={() => shareInvoice(invoice)} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={wp(20)} color="#FFFFFF" />
              <Text style={mStyles.shareBtnText}>Partager la facture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mStyles.closeBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={mStyles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Invoice Card                                                     */
/* ════════════════════════════════════════════════════════════════ */
function InvoiceCard({ item, index, onPress }: { item: InvoiceDto; index: number; onPress: () => void }) {
  const total = item.amount + item.taxAmount;
  const st = getStatus(item.status);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350).springify()}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: st.dot }]} />

        <View style={styles.cardInner}>
          {/* Top row: number + status */}
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardNumber} numberOfLines={1}>
                {item.number || `#${item.id.slice(0, 8).toUpperCase()}`}
              </Text>
              <Text style={styles.cardDate}>{formatDateShort(item.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
              <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>

          {/* Bottom row: amount + chevron */}
          <View style={styles.cardBottom}>
            <Text style={styles.cardAmount}>{formatPrice(total, item.currency)}</Text>
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>Voir</Text>
              <Ionicons name="chevron-forward" size={wp(14)} color={colors.orange[400]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Main Screen                                                      */
/* ════════════════════════════════════════════════════════════════ */
export default function InvoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<InvoiceDto | null>(null);

  const invoicesQ = useQuery({
    queryKey: ['myInvoices'],
    queryFn: async () => (await paymentsApi.getMyInvoices()).data,
  });

  if (invoicesQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement des factures…" />;
  }

  if (invoicesQ.isError) {
    return (
      <View style={[styles.bg, { paddingTop: insets.top }]}>
        <ErrorState
          fullScreen
          title="Erreur"
          description="Impossible de charger vos factures."
          onRetry={() => invoicesQ.refetch()}
          icon="receipt-outline"
        />
      </View>
    );
  }

  const invoices = invoicesQ.data ?? [];

  return (
    <View style={styles.bg}>
      {/* ── Dark gradient header ── */}
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={wp(22)} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Mes factures</Text>
            {invoices.length > 0 && (
              <Text style={styles.headerSub}>
                {invoices.length} facture{invoices.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View style={{ width: wp(40) }} />
        </View>

        {/* Status chips */}
        {invoices.length > 0 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.statsRow}>
            {(['Paid', 'Issued', 'Overdue'] as const).map((s) => {
              const count = invoices.filter((i) => i.status === s).length;
              if (count === 0) return null;
              const st = STATUS[s];
              return (
                <View key={s} style={[styles.statChip, { borderColor: st.dot + '30', backgroundColor: st.bg }]}>
                  <View style={[styles.statDot, { backgroundColor: st.dot }]} />
                  <Text style={[styles.statText, { color: st.color }]}>
                    {count} {st.label.toLowerCase()}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}
      </LinearGradient>

      {/* ── List / Empty ── */}
      {invoices.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={wp(56)} color="rgba(255,255,255,0.12)" />
          <Text style={styles.emptyTitle}>Aucune facture</Text>
          <Text style={styles.emptyDesc}>
            Vos factures apparaîtront ici après votre premier paiement.
          </Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + wp(30) }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <InvoiceCard item={item} index={index} onPress={() => setSelected(item)} />
          )}
        />
      )}

      {/* ── Detail Modal ── */}
      <InvoiceModal invoice={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Screen styles                                                    */
/* ════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0F172A' },

  /* Header */
  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: wp(28),
    borderBottomRightRadius: wp(28),
    ...shadows.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[3],
    marginBottom: spacing[3],
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...textStyles.h4, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  headerSub: { ...textStyles.micro, color: 'rgba(255,255,255,0.35)', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statDot: { width: wp(6), height: wp(6), borderRadius: wp(3) },
  statText: { fontSize: wp(11), fontFamily: fontFamily.semiBold },

  /* List */
  list: { padding: spacing[4], paddingTop: spacing[5] },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...shadows.sm,
  },
  accentBar: { width: wp(4) },
  cardInner: { flex: 1, paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  cardLeft: { flex: 1, marginRight: spacing[2] },
  cardNumber: { ...textStyles.bodyMedium, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  cardDate: { ...textStyles.micro, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: wp(4),
    borderRadius: borderRadius.full,
  },
  statusDot: { width: wp(6), height: wp(6), borderRadius: wp(3) },
  statusText: { fontSize: wp(10), fontFamily: fontFamily.semiBold },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontSize: wp(20), fontFamily: fontFamily.bold, color: colors.orange[400] },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBtnText: { fontSize: wp(12), fontFamily: fontFamily.medium, color: colors.orange[400] },

  /* Empty */
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[8] },
  emptyTitle: { ...textStyles.h4, color: 'rgba(255,255,255,0.55)', marginTop: spacing[4] },
  emptyDesc: { ...textStyles.body, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: spacing[2] },
});

/* ════════════════════════════════════════════════════════════════ */
/*  Modal styles                                                     */
/* ════════════════════════════════════════════════════════════════ */
const mStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: wp(32),
    borderTopRightRadius: wp(32),
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  handle: {
    width: wp(40),
    height: wp(4),
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginVertical: spacing[3],
  },

  /* Receipt header */
  receiptHeader: {
    marginHorizontal: spacing[5],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    paddingVertical: spacing[5],
    marginBottom: spacing[4],
  },
  receiptIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  receiptTitle: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing[1],
  },
  receiptNumber: { ...textStyles.h3, fontFamily: fontFamily.bold, color: '#FFFFFF', marginBottom: spacing[3] },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statusDot: { width: wp(7), height: wp(7), borderRadius: wp(4) },
  statusPillText: { fontSize: wp(12), fontFamily: fontFamily.semiBold },

  /* Body */
  body: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[2] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  metaLabel: { ...textStyles.caption, color: 'rgba(255,255,255,0.4)' },
  metaValue: { ...textStyles.body, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.75)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: spacing[3] },

  /* Amounts */
  amountTable: { gap: spacing[2] },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { ...textStyles.body, color: 'rgba(255,255,255,0.45)' },
  amountVal: { ...textStyles.body, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.7)' },
  totalSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: spacing[1] },
  totalKey: { ...textStyles.bodyMedium, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  totalAmount: { fontSize: wp(22), fontFamily: fontFamily.bold, color: colors.orange[400] },

  /* Note */
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  noteText: { ...textStyles.caption, color: 'rgba(255,255,255,0.3)', flex: 1, lineHeight: 18 },

  /* Actions */
  actions: { gap: spacing[3] },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.orange[500],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  shareBtnText: { ...textStyles.body, fontFamily: fontFamily.bold, color: '#FFFFFF' },
  closeBtn: { alignItems: 'center', paddingVertical: spacing[3] },
  closeBtnText: { ...textStyles.body, color: 'rgba(255,255,255,0.35)', fontFamily: fontFamily.medium },
});
