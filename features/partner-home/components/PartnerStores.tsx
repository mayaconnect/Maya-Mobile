import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    const storeImage = store.imageUrl;

    return (
      <TouchableOpacity
        style={[styles.storeCard, isActive && styles.storeCardActive]}
        onPress={() => onStoreSelect(store)}
        activeOpacity={0.8}
      >
        {/* Badge actif */}
        {isActive && (
          <View style={styles.activeBadge}>
            <LinearGradient
              colors={['#8B2F3F', '#A03D52']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeBadgeGradient}
            >
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.activeBadgeText}>Actif</Text>
            </LinearGradient>
          </View>
        )}

        {/* Image du store avec overlay */}
        <View style={styles.storeImageContainer}>
          {storeImage ? (
            <>
              <Image
                source={{ uri: storeImage }}
                style={styles.storeImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.imageOverlay}
              />
            </>
          ) : (
            <LinearGradient
              colors={['rgba(139, 47, 63, 0.2)', 'rgba(160, 61, 82, 0.15)']}
              style={styles.storePlaceholder}
            >
              <Ionicons name="storefront" size={36} color={Colors.text.primary} />
            </LinearGradient>
          )}
        </View>

        {/* Infos du store */}
        <View style={styles.storeInfo}>
          <View style={styles.storeNameRow}>
            <Text style={styles.storeName} numberOfLines={2}>
              {store.name || 'Sans nom'}
            </Text>
          </View>

          {store.category && (
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={12} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.storeCategory} numberOfLines={1}>
                {store.category}
              </Text>
            </View>
          )}

          {store.address && (
            <View style={styles.storeAddressRow}>
              <Ionicons name="location" size={16} color={Colors.text.secondary} />
              <Text style={styles.storeAddress} numberOfLines={2}>
                {store.address}
              </Text>
            </View>
          )}
        </View>

        {/* Flèche à droite avec fond */}
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche améliorée */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color={Colors.text.primary} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un store..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={22} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          )}
        </View>
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
  searchWrapper: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  } as ViewStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    ...Shadows.md,
    gap: Spacing.sm,
  } as ViewStyle,
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    fontWeight: '500',
  } as TextStyle,
  clearButton: {
    padding: 4,
  } as ViewStyle,
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  } as ViewStyle,
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.lg,
    position: 'relative',
    overflow: 'visible',
  } as ViewStyle,
  storeCardActive: {
    backgroundColor: 'rgba(139, 47, 63, 0.15)',
    borderColor: 'rgba(139, 47, 63, 0.5)',
    borderWidth: 2,
    ...Shadows.xl,
  } as ViewStyle,
  activeBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    zIndex: 10,
    ...Shadows.md,
  } as ViewStyle,
  activeBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  } as ViewStyle,
  activeBadgeText: {
    fontSize: Typography.sizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  } as TextStyle,
  storeImageContainer: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
    position: 'relative',
  } as ViewStyle,
  storeImage: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  } as ViewStyle,
  storePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  storeInfo: {
    flex: 1,
    gap: 6,
    paddingVertical: 2,
  } as ViewStyle,
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  storeName: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  } as TextStyle,
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  storeCategory: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  } as TextStyle,
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
  } as ViewStyle,
  storeAddress: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: Typography.sizes.sm * 1.4,
    fontWeight: '400',
  } as TextStyle,
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
