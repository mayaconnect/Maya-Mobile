/**
 * Maya Connect V2 — Client Invoices Screen
 *
 * Displays the authenticated client's invoice history
 * fetched from GET /api/payments/my-invoices.
 */
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { MHeader, LoadingSpinner, ErrorState, EmptyState } from '../../src/components/ui';
import { paymentsApi } from '../../src/api/subscriptions.api';
import type { InvoiceDto } from '../../src/types';

/* ─────────────────────────────────────────────────────────────── */
/*  Helpers                                                          */
/* ─────────────────────────────────────────────────────────────── */
const formatPrice = (amount: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  Paid: { label: 'Payée', color: colors.success[700], bg: colors.success[50] },
  Issued: { label: 'Émise', color: colors.orange[700], bg: colors.orange[50] },
  Overdue: { label: 'En retard', color: colors.error[700], bg: colors.error[50] },
  Cancelled: { label: 'Annulée', color: colors.neutral[500], bg: colors.neutral[100] },
};

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                        */
/* ─────────────────────────────────────────────────────────────── */
export default function InvoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const invoicesQ = useQuery({
    queryKey: ['myInvoices'],
    queryFn: async () => {
      const res = await paymentsApi.getMyInvoices();
      return res.data;
    },
  });

  const handleDownload = (invoice: InvoiceDto) => {
    if (invoice.pdfPath) {
      Linking.openURL(invoice.pdfPath);
    }
  };

  /* ── Loading ── */
  if (invoicesQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement des factures…" />;
  }

  /* ── Error ── */
  if (invoicesQ.isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <MHeader title="Mes factures" showBack onBack={() => router.back()} />
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

  /* ── Render ── */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MHeader title="Mes factures" showBack onBack={() => router.back()} />

      {invoices.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Aucune facture"
          description="Vos factures apparaîtront ici après votre premier paiement."
        />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = statusConfig[item.status] ?? statusConfig.Issued;
            const totalAmount = item.amount + item.taxAmount;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber}>
                      {item.number || `Facture #${item.id.slice(0, 8)}`}
                    </Text>
                    <Text style={styles.invoiceDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Montant HT</Text>
                    <Text style={styles.amountValue}>
                      {formatPrice(item.amount, item.currency)}
                    </Text>
                  </View>
                  {item.taxAmount > 0 && (
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>TVA</Text>
                      <Text style={styles.amountValue}>
                        {formatPrice(item.taxAmount, item.currency)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.amountRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total TTC</Text>
                    <Text style={styles.totalValue}>
                      {formatPrice(totalAmount, item.currency)}
                    </Text>
                  </View>
                </View>

                {item.pdfPath ? (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="download-outline" size={wp(18)} color={colors.orange[500]} />
                    <Text style={styles.downloadText}>Télécharger le PDF</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Styles                                                           */
/* ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[20],
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    ...shadows.sm,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  invoiceInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  invoiceNumber: {
    ...textStyles.bodyMedium,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },
  invoiceDate: {
    ...textStyles.caption,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },

  /* Status */
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: wp(11),
  },

  /* Body */
  cardBody: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  amountLabel: {
    ...textStyles.body,
    color: colors.neutral[500],
  },
  amountValue: {
    ...textStyles.body,
    color: colors.neutral[700],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    marginTop: spacing[2],
    paddingTop: spacing[2],
  },
  totalLabel: {
    ...textStyles.bodyMedium,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },
  totalValue: {
    fontFamily: fontFamily.bold,
    fontSize: wp(16),
    color: colors.orange[600],
  },

  /* Download */
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing[2],
  },
  downloadText: {
    fontFamily: fontFamily.medium,
    fontSize: wp(13),
    color: colors.orange[500],
  },
});
