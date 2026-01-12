import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerHistoryProps {
  searchQuery: string;
  filterPeriod: 'all' | 'today' | 'week' | 'month';
  selectedStoreId?: string;
  stores: any[];
  transactions: any[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  onSearchChange: (query: string) => void;
  onFilterPeriodChange: (period: 'all' | 'today' | 'week' | 'month') => void;
  onStoreFilterChange: (storeId?: string) => void;
  onExportData: () => void;
}

export function PartnerHistory({
  searchQuery,
  filterPeriod,
  selectedStoreId,
  stores,
  transactions,
  transactionsLoading,
  transactionsError,
  onSearchChange,
  onFilterPeriodChange,
  onStoreFilterChange,
  onExportData,
}: PartnerHistoryProps) {
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

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const storeName = (transaction.storeName || transaction.partnerName || '').toLowerCase();
    const clientName = (transaction.clientName || '').toLowerCase();
    return storeName.includes(searchLower) || clientName.includes(searchLower);
  });

  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeaderSection}>
        <Text style={styles.sectionTitle}>Historique complet</Text>
        <TouchableOpacity style={styles.exportButton} onPress={onExportData}>
          <Ionicons name="download-outline" size={18} color="#8B2F3F" />
          <Text style={styles.exportButtonText}>Exporter</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une transaction..."
          placeholderTextColor={Colors.text.secondary}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres par période */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {[
          { key: 'all', label: 'Tout' },
          { key: 'today', label: "Aujourd'hui" },
          { key: 'week', label: '7 jours' },
          { key: 'month', label: '30 jours' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              filterPeriod === filter.key && styles.filterChipActive,
            ]}
            onPress={() => onFilterPeriodChange(filter.key as any)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterPeriod === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtre par store */}
      {stores.length > 0 && (
        <View style={styles.storeFilterContainer}>
          <Text style={styles.storeFilterLabel}>Filtrer par magasin:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.storeFilterScroll}
            contentContainerStyle={styles.storeFilterContent}
          >
            <TouchableOpacity
              style={[
                styles.storeFilterChip,
                !selectedStoreId && styles.storeFilterChipActive,
              ]}
              onPress={() => onStoreFilterChange(undefined)}
            >
              <Text
                style={[
                  styles.storeFilterChipText,
                  !selectedStoreId && styles.storeFilterChipTextActive,
                ]}
              >
                Tous les magasins
              </Text>
            </TouchableOpacity>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.storeFilterChip,
                  selectedStoreId === store.id && styles.storeFilterChipActive,
                ]}
                onPress={() => onStoreFilterChange(store.id)}
              >
                <Text
                  style={[
                    styles.storeFilterChipText,
                    selectedStoreId === store.id && styles.storeFilterChipTextActive,
                  ]}
                >
                  {store.name || 'Magasin'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Résultats filtrés */}
      {transactionsLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.text.light} />
          <Text style={styles.emptyStateText}>Chargement des transactions...</Text>
        </View>
      ) : transactionsError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={64} color={Colors.status.error} />
          <Text style={styles.emptyStateTitle}>Erreur</Text>
          <Text style={styles.emptyStateText}>{transactionsError}</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>Aucune transaction</Text>
          <Text style={styles.emptyStateText}>
            Aucune transaction trouvée pour cette période
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
            </Text>
          </View>
          {filteredTransactions.map((transaction, index) => {
            const transactionDate = transaction.createdAt || transaction.date || transaction.transactionDate;
            const storeName = transaction.storeName || transaction.partnerName || 'Partenaire inconnu';
            const clientName = transaction.clientName || transaction.customerName || 'Client';
            const amountGross = transaction.amountGross || transaction.amount || 0;
            const amountNet = transaction.amountNet || amountGross;
            const discount = transaction.avgDiscountPercent || transaction.discountPercent || transaction.discount || 0;
            const savings = transaction.discountAmount || 0;
            const personsCount = transaction.personsCount || 0;

            return (
              <View key={transaction.id || transaction.transactionId || index} style={styles.historyCard}>
                {/* Header avec client et date */}
                <View style={styles.historyHeader}>
                  <View style={styles.historyIcon}>
                    <Ionicons name="person" size={24} color={Colors.text.light} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyCustomer}>{clientName}</Text>
                    <Text style={styles.historyDate}>{formatDate(transactionDate)}</Text>
                    <Text style={styles.historyStore}>
                      <Ionicons name="storefront" size={12} color={Colors.text.secondary} /> {storeName}
                    </Text>
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
                          <Text style={styles.amountLabel}>Montant net</Text>
                          <Text style={[styles.amountValue, styles.amountNetValue]}>
                            {amountNet.toFixed(2)}€
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Badges */}
                  <View style={styles.badgesRow}>
                    {savings > 0 && (
                      <View style={styles.savingsBadge}>
                        <Ionicons name="pricetag" size={12} color="#10B981" />
                        <Text style={styles.savingsText}>Réduction : {savings.toFixed(2)}€</Text>
                      </View>
                    )}
                    {discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>-{discount}%</Text>
                      </View>
                    )}
                    {personsCount > 0 && (
                      <View style={styles.personsBadge}>
                        <Ionicons name="people" size={12} color="#8B2F3F" />
                        <Text style={styles.personsText}>{personsCount} pers.</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  historySection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  historyHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.md,
  } as TextStyle,
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
  } as ViewStyle,
  exportButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#8B2F3F',
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    ...Spacing.sm,
  } as ViewStyle,
  searchIcon: {
    marginRight: Spacing.sm,
  } as TextStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
  } as TextStyle,
  filtersContainer: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  filtersContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  } as ViewStyle,
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
  } as ViewStyle,
  filterChipActive: {
    backgroundColor: '#8B2F3F',
    borderColor: '#8B2F3F',
  } as ViewStyle,
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  filterChipTextActive: {
    color: 'white',
    fontWeight: '700',
  } as TextStyle,
  storeFilterContainer: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  storeFilterLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  storeFilterScroll: {
    marginBottom: Spacing.sm,
  } as ViewStyle,
  storeFilterContent: {
    gap: Spacing.sm,
  } as ViewStyle,
  storeFilterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: Spacing.sm,
  } as ViewStyle,
  storeFilterChipActive: {
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    borderColor: '#8B2F3F',
  } as ViewStyle,
  storeFilterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  } as TextStyle,
  storeFilterChipTextActive: {
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  resultsCount: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  resultsCountText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
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
    paddingHorizontal: Spacing.xl,
  } as TextStyle,
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  historyIcon: {
    marginRight: Spacing.md,
  } as ViewStyle,
  historyInfo: {
    flex: 1,
  } as ViewStyle,
  historyCustomer: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  historyDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  } as TextStyle,
  historyStore: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 4,
  } as TextStyle,
  transactionDetails: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: Spacing.sm,
  } as ViewStyle,
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
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
    fontSize: Typography.sizes.base,
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
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  savingsText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: '#10B981',
  } as TextStyle,
  discountBadge: {
    backgroundColor: '#8B2F3F',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  discountBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: 'white',
  } as TextStyle,
  personsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  personsText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: '#8B2F3F',
  } as TextStyle,
});

