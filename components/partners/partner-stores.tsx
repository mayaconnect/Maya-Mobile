import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerStoresProps {
  storeSearchQuery: string;
  stores: any[];
  storesLoading: boolean;
  storesError: string | null;
  filteredStores: any[];
  onSearchChange: (query: string) => void;
  onStoreSelect: (store: any) => void;
}

export function PartnerStores({
  storeSearchQuery,
  stores,
  storesLoading,
  storesError,
  filteredStores,
  onSearchChange,
  onStoreSelect,
}: PartnerStoresProps) {
  console.log('🏪 [PartnerStores] Rendu du composant:', {
    storesCount: stores.length,
    filteredStoresCount: filteredStores.length,
    storesLoading,
    storesError,
    storeSearchQuery,
  });

  return (
    <View style={styles.storesSection}>
      <Text style={styles.sectionTitle}>Mes Magasins</Text>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un magasin..."
          placeholderTextColor={Colors.text.secondary}
          value={storeSearchQuery}
          onChangeText={onSearchChange}
        />
        {storeSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste des stores */}
      {storesLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.emptyStateText}>Chargement des magasins...</Text>
        </View>
      ) : storesError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={64} color={Colors.status.error} />
          <Text style={styles.emptyStateTitle}>Erreur</Text>
          <Text style={styles.emptyStateText}>{storesError}</Text>
        </View>
      ) : filteredStores.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>Aucun magasin</Text>
          <Text style={styles.emptyStateText}>
            {storeSearchQuery 
              ? `Aucun magasin ne correspond à votre recherche "${storeSearchQuery}"`
              : stores.length === 0
                ? 'Aucun magasin trouvé pour votre compte. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.'
                : 'Aucun magasin ne correspond à votre recherche'}
          </Text>
          {stores.length > 0 && (
            <Text style={[styles.emptyStateText, { marginTop: Spacing.sm, fontSize: Typography.sizes.sm }]}>
              ({stores.length} magasin{stores.length > 1 ? 's' : ''} au total)
            </Text>
          )}
        </View>
      ) : (
        <>
          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {filteredStores.length} magasin{filteredStores.length > 1 ? 's' : ''}
            </Text>
          </View>
          {filteredStores.map((store) => {
            const partner = store.partner || store.partnerData;
            const address = store.address;
            const addressString = address 
              ? `${address.street || ''} ${address.postalCode || ''} ${address.city || ''}`.trim()
              : 'Adresse non renseignée';

            return (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                onPress={() => onStoreSelect(store)}
              >
                <View style={styles.storeCardHeader}>
                  <View style={styles.storeIcon}>
                    <Ionicons name="storefront" size={24} color={Colors.primary[600]} />
                  </View>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>
                      {store.name || partner?.name || 'Magasin sans nom'}
                    </Text>
                    {store.category && (
                      <Text style={styles.storeCategory}>{store.category}</Text>
                    )}
                    <View style={styles.storeAddressRow}>
                      <Ionicons name="location" size={14} color={Colors.text.secondary} />
                      <Text style={styles.storeAddress} numberOfLines={1}>
                        {addressString}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                </View>
                {store.isOpen !== undefined && (
                  <View style={styles.storeStatus}>
                    <View style={[styles.statusBadge, store.isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed]}>
                      <Ionicons 
                        name="time" 
                        size={12} 
                        color={store.isOpen ? '#10B981' : Colors.status.error} 
                      />
                      <Text style={[styles.statusText, { color: store.isOpen ? '#10B981' : Colors.status.error }]}>
                        {store.isOpen ? 'Ouvert' : 'Fermé'}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  storesSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.md,
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
    ...Shadows.sm,
  } as ViewStyle,
  searchIcon: {
    marginRight: Spacing.sm,
  } as TextStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
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
  resultsCount: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  resultsCountText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  storeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  storeInfo: {
    flex: 1,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  storeCategory: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary[600],
    fontWeight: '600',
    marginBottom: 4,
  } as TextStyle,
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  storeAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
  storeStatus: {
    marginTop: Spacing.sm,
  } as ViewStyle,
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  } as ViewStyle,
  statusBadgeOpen: {
    backgroundColor: '#D1FAE5',
  } as ViewStyle,
  statusBadgeClosed: {
    backgroundColor: '#FEE2E2',
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
});

