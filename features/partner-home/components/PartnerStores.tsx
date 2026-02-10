import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface PartnerStoresProps {
  stores: any[];
  storesLoading: boolean;
  storesError: string | null;
  activeStoreId?: string | null;
  onStoreSelect: (store: any) => void;
}

export function PartnerStores({
  stores,
  storesLoading,
  storesError,
  activeStoreId,
  onStoreSelect,
}: PartnerStoresProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les stores selon la recherche
  const filteredStores = stores.filter((store) =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStoreCard = ({ item: store }: { item: any }) => {
    const isActive = store.id === activeStoreId || store.storeId === activeStoreId;
    const storeImage = store.image || store.imageUrl || store.restaurantImage;

    return (
      <TouchableOpacity
        style={[styles.storeCard, isActive && styles.storeCardActive]}
        onPress={() => onStoreSelect(store)}
        activeOpacity={0.7}
      >
        {/* Image du store */}
        <View style={styles.storeImageContainer}>
          {storeImage ? (
            <Image
              source={{ uri: storeImage }}
              style={styles.storeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.storePlaceholder}>
              <Ionicons name="storefront" size={32} color={Colors.text.secondary} />
            </View>
          )}
        </View>

        {/* Infos du store */}
        <View style={styles.storeInfo}>
          <View style={styles.storeNameRow}>
            <Text style={styles.storeName} numberOfLines={2}>
              {store.name || 'Sans nom'}
            </Text>
            {isActive && (
              <Ionicons name="checkmark-circle" size={18} color={Colors.text.primary} />
            )}
          </View>

          {store.category && (
            <Text style={styles.storeCategory} numberOfLines={1}>
              {store.category}
            </Text>
          )}

          {store.address && (
            <View style={styles.storeAddressRow}>
              <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
              <Text style={styles.storeAddress} numberOfLines={2}>
                {store.address}
              </Text>
            </View>
          )}
        </View>

        {/* Flèche à droite */}
        <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Titre */}
      <Text style={styles.pageTitle}>Mes Stores</Text>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou adresse..."
          placeholderTextColor={Colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste des stores */}
      {storesLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.text.primary} />
          <Text style={styles.emptyStateText}>Chargement de vos stores...</Text>
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
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'Aucun résultat' : 'Aucun store'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? 'Essayez une autre recherche'
              : 'Vous n\'avez pas encore de store enregistré'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStores}
          renderItem={renderStoreCard}
          keyExtractor={(item) => item.id || item.storeId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  pageTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
  } as TextStyle,
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  } as ViewStyle,
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  storeCardActive: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
  } as ViewStyle,
  storeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  } as ViewStyle,
  storeImage: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  storePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  storeInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  storeName: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  } as TextStyle,
  storeCategory: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  } as ViewStyle,
  storeAddress: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.sm * 1.3,
  } as TextStyle,
  chevron: {
    marginLeft: Spacing.xs,
  } as ViewStyle,
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: Typography.sizes.xl,
    color: Colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  } as TextStyle,
  emptyStateText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
});
