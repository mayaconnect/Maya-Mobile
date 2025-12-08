import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface PartnerMeProps {
  user: any;
  storeSearchQuery: string;
  stores: any[];
  storesLoading: boolean;
  storesError: string | null;
  filteredStores: any[];
  onSearchChange: (query: string) => void;
  onStoreSelect: (store: any) => void;
}

export function PartnerMe({
  user,
  storeSearchQuery,
  stores,
  storesLoading,
  storesError,
  filteredStores,
  onSearchChange,
  onStoreSelect,
}: PartnerMeProps) {
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Partenaire Maya';

  return (
    <View style={styles.container}>
      {/* Bloc "Moi" / profil partenaire */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={28} color={Colors.primary[600]} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{fullName}</Text>
          {user?.email && <Text style={styles.profileEmail}>{user.email}</Text>}
          {user?.companyName && (
            <Text style={styles.profileCompany}>{user.companyName}</Text>
          )}
        </View>
      </View>

      {/* Magasins du partenaire */}
      <View style={styles.storesSection}>
        <Text style={styles.sectionTitle}>Mes magasins</Text>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.text.secondary}
            style={styles.searchIcon}
          />
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
              <Text
                style={[
                  styles.emptyStateText,
                  { marginTop: Spacing.sm, fontSize: Typography.sizes.sm },
                ]}
              >
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

              // Déterminer l'icône et la couleur selon la catégorie
              const getCategoryIcon = (category: string | undefined): string => {
                if (!category) return 'storefront';
                const cat = category.toLowerCase();
                if (cat.includes('restaurant') || cat.includes('food')) return 'restaurant';
                if (cat.includes('shop') || cat.includes('magasin')) return 'cart';
                if (cat.includes('café') || cat.includes('coffee')) return 'cafe';
                if (cat.includes('bar')) return 'wine';
                if (cat.includes('sport')) return 'fitness';
                if (cat.includes('beauty') || cat.includes('beauté')) return 'cut';
                return 'storefront';
              };

              const getCategoryColor = (category: string | undefined): string => {
                if (!category) return Colors.primary[600];
                const cat = category.toLowerCase();
                if (cat.includes('restaurant') || cat.includes('food')) return '#F59E0B';
                if (cat.includes('shop') || cat.includes('magasin')) return '#8B5CF6';
                if (cat.includes('café') || cat.includes('coffee')) return '#D97706';
                if (cat.includes('bar')) return '#DC2626';
                if (cat.includes('sport')) return '#10B981';
                if (cat.includes('beauty') || cat.includes('beauté')) return '#EC4899';
                return Colors.primary[600];
              };

              const iconName = getCategoryIcon(store.category);
              const iconColor = getCategoryColor(store.category);

              return (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeCard}
                  onPress={() => onStoreSelect(store)}
                  activeOpacity={0.7}
                >
                  <View style={styles.storeCardContent}>
                    {/* Icône du magasin avec badge de statut */}
                    <View style={styles.storeIconContainer}>
                      <View style={[styles.storeIcon, { backgroundColor: `${iconColor}15` }]}>
                        <Ionicons name={iconName as any} size={32} color={iconColor} />
                      </View>
                      {store.isOpen !== undefined && (
                        <View
                          style={[
                            styles.storeStatusIndicator,
                            store.isOpen ? styles.storeStatusOpen : styles.storeStatusClosed,
                          ]}
                        />
                      )}
                    </View>

                    {/* Informations du magasin */}
                    <View style={styles.storeDetails}>
                      <View style={styles.storeHeader}>
                        <View style={styles.storeTitleContainer}>
                          <Text style={styles.storeName} numberOfLines={1}>
                            {store.name || partner?.name || 'Magasin sans nom'}
                          </Text>
                          {store.category && (
                            <View style={[styles.categoryBadge, { backgroundColor: `${iconColor}20` }]}>
                              <Text style={[styles.categoryText, { color: iconColor }]}>
                                {store.category}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Ionicons
                          name="chevron-forward-circle"
                          size={24}
                          color="rgba(255, 255, 255, 0.3)"
                        />
                      </View>

                      {/* Adresse */}
                      <View style={styles.storeAddressContainer}>
                        <Ionicons name="location" size={16} color={Colors.text.secondary} />
                        <Text style={styles.storeAddress} numberOfLines={2}>
                          {addressString}
                        </Text>
                      </View>

                      {/* Badge de statut en bas */}
                      {store.isOpen !== undefined && (
                        <View style={styles.storeFooter}>
                          <View
                            style={[
                              styles.statusBadge,
                              store.isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed,
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: store.isOpen ? '#10B981' : Colors.status.error },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                { color: store.isOpen ? '#10B981' : Colors.status.error },
                              ]}
                            >
                              {store.isOpen ? 'Ouvert maintenant' : 'Fermé'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  profileInfo: {
    flex: 1,
  } as ViewStyle,
  profileName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  profileEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  } as TextStyle,
  profileCompany: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary[200],
    fontWeight: '600',
  } as TextStyle,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  storeCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  } as ViewStyle,
  storeIconContainer: {
    position: 'relative',
  } as ViewStyle,
  storeIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  } as ViewStyle,
  storeStatusIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.md,
  } as ViewStyle,
  storeStatusOpen: {
    backgroundColor: '#10B981',
  } as ViewStyle,
  storeStatusClosed: {
    backgroundColor: Colors.status.error,
  } as ViewStyle,
  storeDetails: {
    flex: 1,
    gap: Spacing.sm,
  } as ViewStyle,
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  } as ViewStyle,
  storeTitleContainer: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  } as ViewStyle,
  categoryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  storeAddressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  storeAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  storeFooter: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: Spacing.xs,
  } as ViewStyle,
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  } as ViewStyle,
  statusBadgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  } as ViewStyle,
  statusBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
});


