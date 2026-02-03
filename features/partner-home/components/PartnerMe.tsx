import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
interface PartnerMeProps {
  user: any;
  storeSearchQuery: string;
  stores: any[];
  storesLoading: boolean;
  storesError: string | null;
  filteredStores: any[];
  activeStoreId?: string | null;
  activeStore?: any | null;
  onSearchChange: (query: string) => void;
  onStoreSelect: (store: any) => void;
  onChangeStore: () => void;
}

export function PartnerMe({
  user,
  storeSearchQuery,
  stores,
  storesLoading,
  storesError,
  filteredStores,
  activeStoreId,
  activeStore,
  onSearchChange,
  onStoreSelect,
  onChangeStore,
}: PartnerMeProps) {
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Partenaire Maya';

  // Animations pour les cercles flottants
  const circle1Opacity = useSharedValue(0.15);
  const circle2Opacity = useSharedValue(0.12);

  React.useEffect(() => {
    circle1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 3000 }),
        withTiming(0.15, { duration: 3000 })
      ),
      -1,
      true
    );
    circle2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 4000 }),
        withTiming(0.12, { duration: 4000 })
      ),
      -1,
      true
    );
  }, []);

  const circle1Style = useAnimatedStyle(() => ({
    opacity: circle1Opacity.value,
  }));

  const circle2Style = useAnimatedStyle(() => ({
    opacity: circle2Opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Éléments décoratifs flottants */}
     

      {/* Bloc "Moi" / profil partenaire */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <BlurView intensity={20} tint="dark" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatarContainer}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={32} color={Colors.text.light} />
              </View>
              {user?.isActive && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{fullName}</Text>
                <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />
              </View>
              {user?.email && (
                <View style={styles.profileEmailRow}>
                  <Ionicons name="mail-outline" size={14} color={Colors.text.secondary} />
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>
              )}
              {user?.companyName && (
                <View style={styles.companyBadge}>
                  <Ionicons name="business-outline" size={14} color={Colors.text.secondary} />
                  <Text style={styles.profileCompany}>{user.companyName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Magasin actif */}
          {activeStoreId && activeStore && (
            <View style={styles.activeStoreSection}>
              <View style={styles.activeStoreInfo}>
                <View style={styles.activeStoreIcon}>
                  <Ionicons name="storefront" size={20} color={Colors.text.light} />
                </View>
                <View style={styles.activeStoreDetails}>
                  <Text style={styles.activeStoreLabel}>Magasin actif</Text>
                  <Text style={styles.activeStoreName}>
                    {activeStore.name || activeStore.partner?.name || 'Magasin'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.changeStoreButton}
                onPress={onChangeStore}
              >
                <Ionicons name="swap-horizontal" size={16} color={Colors.text.light} />
                <Text style={styles.changeStoreButtonText}>Changer</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Statistiques rapides */}
          {stores.length > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="storefront-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.statValue}>{stores.length}</Text>
                <Text style={styles.statLabel}>Magasin{stores.length > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.status.success} />
                <Text style={styles.statValue}>{stores.filter(s => s.isActive).length}</Text>
                <Text style={styles.statLabel}>Actif{stores.filter(s => s.isActive).length > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.statValue}>
                  {new Set(stores.map(s => s.city || s.address?.city).filter(Boolean)).size}
                </Text>
                <Text style={styles.statLabel}>Ville{new Set(stores.map(s => s.city || s.address?.city).filter(Boolean)).size > 1 ? 's' : ''}</Text>
              </View>
            </View>
          )}
        </BlurView>
      </Animated.View>

      {/* Magasins du partenaire */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.storesSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="storefront-outline" size={20} color={Colors.text.light} />
            <Text style={styles.sectionTitle}>Mes magasins</Text>
            {stores.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{stores.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Barre de recherche */}
        <BlurView intensity={15} tint="dark" style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
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
        </BlurView>

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
            {filteredStores.map((store, index) => {
              const partner = store.partner || store.partnerData;
              const address = store.address;
              const addressString = address
                ? `${address.street || ''} ${address.postalCode || ''} ${address.city || ''}`.trim()
                : 'Adresse non renseignée';

              // Déterminer l'icône selon la catégorie
              const getCategoryIcon = (category: string | undefined): string => {
                if (!category) return 'storefront-outline';
                const cat = category.toLowerCase();
                if (cat.includes('restaurant') || cat.includes('food')) return 'restaurant-outline';
                if (cat.includes('shop') || cat.includes('magasin')) return 'cart-outline';
                if (cat.includes('café') || cat.includes('coffee')) return 'cafe-outline';
                if (cat.includes('bar')) return 'wine-outline';
                if (cat.includes('sport')) return 'fitness-outline';
                if (cat.includes('beauty') || cat.includes('beauté')) return 'cut-outline';
                return 'storefront-outline';
              };

              const iconName = getCategoryIcon(store.category);

              return (
                <Animated.View
                  key={store.id}
                  entering={FadeInUp.delay(100 + index * 50).springify()}
                >
                  <BlurView intensity={15} tint="dark" style={styles.storeCard}>
                    <TouchableOpacity
                      style={styles.storeCardContent}
                      onPress={() => onStoreSelect(store)}
                      activeOpacity={0.7}
                    >
                      {/* Icône du magasin */}
                      <View style={styles.storeIconContainer}>
                        <View style={styles.storeIcon}>
                          <Ionicons name={iconName as any} size={32} color={Colors.text.light} />
                        </View>
                        {store.isActive && (
                          <View style={styles.activeIndicator}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.status.success} />
                          </View>
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
                              <Text style={styles.storeCategory}>{store.category}</Text>
                            )}
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                        </View>

                        {/* Adresse */}
                        <View style={styles.storeAddressRow}>
                          <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
                          <Text style={styles.storeAddress} numberOfLines={1}>
                            {addressString}
                          </Text>
                        </View>

                        {/* Informations additionnelles */}
                        <View style={styles.storeInfoRow}>
                          {store.avgDiscountPercent && (
                            <View style={styles.infoBadge}>
                              <Ionicons name="pricetag-outline" size={12} color={Colors.status.success} />
                              <Text style={styles.infoBadgeText}>-{store.avgDiscountPercent}%</Text>
                            </View>
                          )}
                          {store.isOpen !== undefined && (
                            <View style={[styles.statusBadge, store.isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed]}>
                              <View style={[styles.statusDot, { backgroundColor: store.isOpen ? Colors.status.success : Colors.status.error }]} />
                              <Text style={[styles.statusText, { color: store.isOpen ? Colors.status.success : Colors.status.error }]}>
                                {store.isOpen ? 'Ouvert' : 'Fermé'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </BlurView>
                </Animated.View>
              );
            })}
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    position: 'relative',
  } as ViewStyle,
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  } as ViewStyle,
  floatingCircle: {
    position: 'absolute',
    borderRadius: 9999,
  } as ViewStyle,
  circle1: {
    width: 180,
    height: 180,
    backgroundColor: Colors.accent.rose,
    top: -40,
    right: -60,
  } as ViewStyle,
  circle2: {
    width: 140,
    height: 140,
    backgroundColor: Colors.accent.gold,
    bottom: 100,
    left: -50,
  } as ViewStyle,
  profileCard: {
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  } as ViewStyle,
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  profileAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  } as ViewStyle,
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.status.success,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  } as ViewStyle,
  profileInfo: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  profileName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    flex: 1,
  } as TextStyle,
  profileEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  profileEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(139, 47, 63, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.25)',
  } as ViewStyle,
  profileCompany: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  activeStoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  activeStoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  } as ViewStyle,
  activeStoreIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  activeStoreDetails: {
    flex: 1,
  } as ViewStyle,
  activeStoreLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 2,
  } as TextStyle,
  activeStoreName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  changeStoreButton: {
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
  changeStoreButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    marginTop: 2,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  storesSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  sectionHeader: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    flex: 1,
  } as TextStyle,
  countBadge: {
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
    minWidth: 24,
    alignItems: 'center',
  } as ViewStyle,
  countBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    overflow: 'hidden',
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

    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    overflow: 'hidden',
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
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  activeIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.status.success,
  } as ViewStyle,
  storeDetails: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  storeTitleContainer: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  storeCategory: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  storeAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  storeAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  } as ViewStyle,
  infoBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.status.success,
    fontWeight: '700',
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
  } as ViewStyle,
  statusBadgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  } as ViewStyle,
  statusBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  } as ViewStyle,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  } as TextStyle,
});


