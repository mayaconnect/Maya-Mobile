import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
     

      {/* Bloc "Moi" / profil partenaire avec gradient */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LinearGradient
          colors={['rgba(139, 47, 63, 0.35)', 'rgba(139, 47, 63, 0.2)', 'rgba(139, 47, 63, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarContainer}>
            <BlurView intensity={30} tint="light" style={styles.profileAvatarBlur}>
              <LinearGradient
                colors={['#8B2F3F', '#A53F51', '#C05566']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileAvatar}
              >
                <Ionicons name="person" size={36} color={Colors.text.light} />
              </LinearGradient>
            </BlurView>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{fullName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary[500]} />
              </View>
            </View>
            {user?.email && <Text style={styles.profileEmail}>{user.email}</Text>}
            {user?.companyName && (
              <View style={styles.companyBadge}>
                <Ionicons name="business" size={14} color={Colors.primary[500]} />
                <Text style={styles.profileCompany}>{user.companyName}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Statistiques rapides */}
        {stores.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="storefront" size={20} color={Colors.primary[600]} />
              <Text style={styles.statValue}>{stores.length}</Text>
              <Text style={styles.statLabel}>Magasin{stores.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.primary[500]} />
              <Text style={styles.statValue}>{stores.filter(s => s.isActive).length}</Text>
              <Text style={styles.statLabel}>Actif{stores.filter(s => s.isActive).length > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="location" size={20} color={Colors.primary[600]} />
              <Text style={styles.statValue}>
                {new Set(stores.map(s => s.city || s.address?.city).filter(Boolean)).size}
              </Text>
              <Text style={styles.statLabel}>Ville{new Set(stores.map(s => s.city || s.address?.city).filter(Boolean)).size > 1 ? 's' : ''}</Text>
            </View>
          </View>
        )}
        </LinearGradient>
      </Animated.View>

      {/* Magasins du partenaire */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.storesSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="storefront" size={24} color="#8B2F3F" />
            <Text style={styles.sectionTitle}>Mes magasins</Text>
          </View>
          {stores.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{stores.length}</Text>
            </View>
          )}
        </View>

        {/* Barre de recherche */}
        <BlurView intensity={60} tint="dark" style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.text.light}
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
              <Ionicons name="close-circle" size={20} color={Colors.text.light} />
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
                if (!category) return Colors.primary[400];
                const cat = category.toLowerCase();

                // Palette harmonisée avec l'app : primaires / secondaires adoucies
                if (cat.includes('restaurant') || cat.includes('food')) return Colors.primary[300];
                if (cat.includes('shop') || cat.includes('magasin')) return Colors.secondary?.[400] ?? Colors.primary[300];
                if (cat.includes('café') || cat.includes('coffee')) return Colors.primary[200];
                if (cat.includes('bar')) return Colors.primary[500];
                if (cat.includes('sport')) return Colors.primary[100];
                if (cat.includes('beauty') || cat.includes('beauté')) return Colors.secondary?.[300] ?? Colors.primary[400];

                return Colors.primary[400];
              };
              const getCategoryBackgroundColor = (category: string | undefined): string => {
                return '#0B0610';
              };

              const iconName = getCategoryIcon(store.category);
              const iconColor = getCategoryColor(store.category);
              const categoryBackgroundColor = getCategoryBackgroundColor(store.category);

              return (
                <Animated.View
                  key={store.id}
                  entering={FadeInUp.delay(300).springify()}
                >
                  <TouchableOpacity
                    style={styles.storeCard}
                    onPress={() => onStoreSelect(store)}
                    activeOpacity={0.8}
                  >
                    <BlurView intensity={40} tint="dark" style={styles.storeCardBlur}>
                      <LinearGradient
                        colors={[`${iconColor}12`, 'rgba(255, 255, 255, 0.08)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.storeCardGradient}
                      >
                    <View style={styles.storeCardContent}>
                      {/* Icône du magasin avec badge de statut et effet lumineux */}
                      <View style={styles.storeIconContainer}>
                        <LinearGradient
                          colors={[iconColor, `${iconColor}CC`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.storeIcon}
                        >
                          <Ionicons name={iconName as any} size={42} color={categoryBackgroundColor} />
                        </LinearGradient>
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
                            <View style={styles.storeNameRow}>
                              <Text style={styles.storeName} numberOfLines={1}>
                                {store.name || partner?.name || 'Magasin sans nom'}
                              </Text>
                              {store.isActive && (
                                <View style={styles.activeBadge}>
                                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary[500]} />
                                </View>
                              )}
                            </View>
                            {store.category && (
                              <View style={[styles.categoryBadge, { backgroundColor: `${iconColor}25`, borderColor: `${iconColor}50` }]}>
                                <Text style={[styles.categoryText, { color: iconColor }]}>
                                  {store.category}
                                </Text>
                              </View>
                            )}
                          </View>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => onStoreSelect(store)}
                          >
                            <Ionicons
                              name="arrow-forward-circle"
                              size={28}
                              color={iconColor}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Adresse avec icône stylisée */}
                        <View style={styles.storeAddressContainer}>
                          <View style={[styles.addressIconWrapper, { backgroundColor: `${iconColor}15` }]}>
                            <Ionicons name="location" size={14} color={iconColor} />
                          </View>
                          <Text style={styles.storeAddress} numberOfLines={2}>
                            {addressString}
                          </Text>
                        </View>

                        {/* Informations additionnelles */}
                        {(store.avgDiscountPercent || store.phone) && (
                          <View style={styles.storeInfoRow}>
                            {store.avgDiscountPercent && (
                              <View style={styles.infoTag}>
                                <Ionicons name="pricetag" size={12} color={Colors.primary[500]} />
                                <Text style={styles.infoTagText}>-{store.avgDiscountPercent}%</Text>
                              </View>
                            )}
                            {store.phone && (
                              <View style={styles.infoTag}>
                                <Ionicons name="call" size={12} color={Colors.primary[600]} />
                                <Text style={styles.infoTagText}>Tel</Text>
                              </View>
                            )}
                          </View>
                        )}

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
                                  { backgroundColor: store.isOpen ? Colors.primary[500] : Colors.status.error },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: store.isOpen ? Colors.primary[500] : Colors.status.error },
                                ]}
                              >
                                {store.isOpen ? 'Ouvert maintenant' : 'Fermé'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.xl,
    overflow: 'hidden',
    zIndex: 1,
  } as ViewStyle,
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  profileAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.lg,
  } as ViewStyle,
  profileAvatarBlur: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Shadows.xl,
  } as ViewStyle,
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  } as ViewStyle,
  profileInfo: {
    flex: 1,
  } as ViewStyle,
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  profileName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  verifiedBadge: {
    marginLeft: 4,
  } as ViewStyle,
  profileEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
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
  } as ViewStyle,
  profileCompany: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary[500],
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -1,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  storesSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  countBadge: {
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 32,
    alignItems: 'center',
  } as ViewStyle,
  countBadgeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
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
    borderRadius: BorderRadius['3xl'],
    marginBottom: Spacing.lg,
    ...Shadows.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 6,
  } as ViewStyle,
  storeCardBlur: {
    borderRadius: BorderRadius['3xl'],
    overflow: 'hidden',
  } as ViewStyle,
  storeCardGradient: {
    padding: Spacing.xl,
  } as ViewStyle,
  storeCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
  } as ViewStyle,
  storeIconContainer: {
    position: 'relative',
  } as ViewStyle,
  storeIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Shadows.md,
    elevation: 3,
  } as ViewStyle,
  storeStatusIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: 'rgba(0, 0, 0, 0.4)',
    ...Shadows.xl,
    elevation: 8,
  } as ViewStyle,
  storeStatusOpen: {
    backgroundColor: '#10B981',
  } as ViewStyle,
  storeStatusClosed: {
    backgroundColor: '#EF4444',
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
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.6,
    flex: 1,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  activeBadge: {
    marginLeft: 4,
  } as ViewStyle,
  actionButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignSelf: 'flex-start',
    ...Shadows.sm,
    elevation: 3,
  } as ViewStyle,
  categoryText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  storeAddressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  addressIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.sm,
  } as ViewStyle,
  storeAddress: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.2,
  } as TextStyle,
  storeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  } as ViewStyle,
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  infoTagText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontWeight: '700',
  } as TextStyle,
  storeFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: Spacing.md,
  } as ViewStyle,
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
  } as ViewStyle,
  statusBadgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  } as ViewStyle,
  statusBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  } as ViewStyle,
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
});


