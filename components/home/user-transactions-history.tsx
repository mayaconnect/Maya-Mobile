import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface UserTransactionsHistoryProps {
  transactions: any[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  onRefresh: () => void;
}

export const UserTransactionsHistory = React.memo(function UserTransactionsHistory({
  transactions,
  transactionsLoading,
  transactionsError,
  onRefresh,
}: UserTransactionsHistoryProps) {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date inconnue';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique de mes visites</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={transactionsLoading}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={Colors.text.light}
            style={transactionsLoading && { opacity: 0.5 }}
          />
        </TouchableOpacity>
      </View>

      {transactionsLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.text.light} />
          <Text style={styles.emptyStateText}>Chargement de votre historique...</Text>
        </View>
      ) : transactionsError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={Colors.status.error} />
          <Text style={styles.emptyStateTitle}>Erreur</Text>
          <Text style={styles.emptyStateText}>{transactionsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={Colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>Aucune visite</Text>
          <Text style={styles.emptyStateText}>
            Vous n'avez pas encore visité de partenaires.{'\n'}
            Présentez votre QR Code chez un partenaire pour commencer !
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.transactionsList}
          showsVerticalScrollIndicator={false}
        >
          {transactions.map((transaction, index) => {
            const transactionDate = transaction.createdAt || transaction.date || transaction.transactionDate;
            const storeName = transaction.storeName || transaction.partnerName || 'Partenaire inconnu';
            const amountGross = transaction.amountGross || transaction.amount || 0;
            const amountNet = transaction.amountNet || amountGross;
            const discount = transaction.avgDiscountPercent || transaction.discountPercent || transaction.discount || 0;
            const savings = transaction.discountAmount || 0;
            const personsCount = transaction.personsCount || 0;

            return (
              <View key={transaction.id || transaction.transactionId || index} style={styles.transactionCard}>
                {/* Header avec store et date */}
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="storefront" size={24} color="#8B2F3F" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionStore}>{storeName}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transactionDate)}</Text>
                  </View>
                </View>

                {/* Détails de la transaction */}
                <View style={styles.transactionDetails}>
                  {/* Montants */}
                  <View style={styles.amountsRow}>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Montant initial</Text>
                      <Text style={styles.amountValue}>{amountGross.toFixed(2)}€</Text>
                    </View>
                    {savings > 0 && (
                      <>
                        <Ionicons name="arrow-forward" size={16} color={Colors.text.secondary} />
                        <View style={styles.amountItem}>
                          <Text style={styles.amountLabel}>Montant payé</Text>
                          <Text style={[styles.amountValue, styles.amountNetValue]}>
                            {amountNet.toFixed(2)}€
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Économies et badges */}
                  <View style={styles.badgesRow}>
                    {savings > 0 && (
                      <View style={styles.savingsContainer}>
                        <Ionicons name="pricetag" size={14} color="#10B981" />
                        <Text style={styles.savingsValue}>
                          Économisé : {savings.toFixed(2)}€
                        </Text>
                      </View>
                    )}
                    {discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{discount}%</Text>
                      </View>
                    )}
                    {personsCount > 0 && (
                      <View style={styles.personsBadge}>
                        <Ionicons name="people" size={14} color="#8B2F3F" />
                        <Text style={styles.personsText}>{personsCount} pers.</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  refreshButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  } as TextStyle,
  emptyStateText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#8B2F3F',
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  retryButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  } as TextStyle,
  transactionsList: {
    maxHeight: 400,
  } as ViewStyle,
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  transactionInfo: {
    flex: 1,
  } as ViewStyle,
  transactionStore: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  transactionDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  transactionDetails: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  } as ViewStyle,
  amountItem: {
    flex: 1,
  } as ViewStyle,
  amountLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 4,
  } as TextStyle,
  amountValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  amountNetValue: {
    color: '#10B981',
  } as TextStyle,
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  } as ViewStyle,
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  savingsValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B2F3F',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  discountText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: 'white',
  } as TextStyle,
  personsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  personsText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: '#8B2F3F',
  } as TextStyle,
});
