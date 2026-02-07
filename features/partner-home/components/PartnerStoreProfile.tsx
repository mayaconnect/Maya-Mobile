import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerStoreProfileProps {
  store: any;
  stores: any[];
  transactions: any[];
  clients: any[];
  onChangeStore: () => void;
  loading?: boolean;
}

export const PartnerStoreProfile: React.FC<PartnerStoreProfileProps> = ({
  store,
  stores = [],
  transactions = [],
  clients = [],
  onChangeStore,
  loading = false,
}) => {
  // Calculer les statistiques
  const stats = useMemo(() => {
    // Note moyenne (rating) - utiliser les vraies données du store
    const averageRating = store?.rating || store?.averageRating || store?.partner?.rating || store?.partner?.averageRating || 0;
    const reviewCount = store?.reviewCount || store?.reviewsCount || store?.partner?.reviewCount || store?.partner?.reviewsCount || 0;

    // Clients actifs (clients uniques qui ont fait des transactions)
    const uniqueClients = new Set(
      transactions.map((t: any) => {
        const customer = t.customer || t.client || {};
        return customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      }).filter(Boolean)
    ).size;

    // Revenus mensuels
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = transactions.filter((t: any) => {
      const date = new Date(t.createdAt || t.date || t.transactionDate);
      return date >= startOfMonth;
    });
    const monthlyRevenue = monthTransactions.reduce((sum: number, t: any) => sum + (t.amountNet || t.amountAfterDiscount || t.amountGross || t.amount || 0), 0);

    // Taux de retour (clients qui sont revenus)
    const clientVisitCounts = new Map<string, number>();
    transactions.forEach((t: any) => {
      const customer = t.customer || t.client || {};
      const customerId = customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      if (customerId) {
        clientVisitCounts.set(customerId, (clientVisitCounts.get(customerId) || 0) + 1);
      }
    });
    const returningClients = Array.from(clientVisitCounts.values()).filter(count => count > 1).length;
    const returnRate = uniqueClients > 0 ? (returningClients / uniqueClients) * 100 : 0;

    return {
      averageRating: averageRating > 0 ? averageRating : 0,
      reviewCount: reviewCount > 0 ? reviewCount : 0,
      activeClients: uniqueClients,
      monthlyRevenue,
      returnRate,
    };
  }, [store, transactions, clients]);

  // Formater l'adresse
  const formatAddress = () => {
    const address = store?.address;
    if (!address) return 'Adresse non renseignée';
    
    if (typeof address === 'string') {
      return address;
    }
    
    const parts = [
      address.street,
      address.postalCode,
      address.city,
    ].filter(Boolean);
    
    return parts.join(', ') || 'Adresse non renseignée';
  };

  // Formater les horaires
  const formatHours = () => {
    const hours = store?.openingHours || store?.hours;
    if (!hours) return 'Non renseigné';
    
    if (typeof hours === 'string') {
      return hours;
    }
    
    if (hours.opening && hours.closing) {
      return `${hours.opening}-${hours.closing}`;
    }
    
    return 'Non renseigné';
  };

  // Déterminer la catégorie
  const category = store?.category || store?.partner?.category || null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={styles.loadingText}>Chargement des informations...</Text>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="storefront-outline" size={64} color={Colors.text.secondary} />
        <Text style={styles.emptyTitle}>Aucun magasin sélectionné</Text>
        <Text style={styles.emptyText}>Sélectionnez un magasin pour voir ses informations</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec nom, badges, note, localisation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.storeName}>{store.name || store.partner?.name || 'Magasin'}</Text>
          <View style={styles.badgesRow}>
            {category && (
              <View style={[styles.badge, styles.categoryBadge]}>
                <Text style={styles.badgeText}>{category}</Text>
              </View>
            )}
            <View style={[styles.badge, styles.verifiedBadge]}>
              <Text style={styles.badgeText}>Partenaire vérifié</Text>
            </View>
          </View>
          {stats.averageRating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.ratingText}>
                {stats.averageRating.toFixed(1)} {stats.reviewCount > 0 && `(${stats.reviewCount} avis)`}
              </Text>
            </View>
          )}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={Colors.text.secondary} />
            <Text style={styles.locationText}>
              {store.address?.city || store.city || 'Localisation non renseignée'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.changeButton} onPress={onChangeStore} activeOpacity={0.7}>
          <Ionicons name="swap-horizontal" size={16} color={Colors.text.light} />
          <Text style={styles.changeButtonText}>Changer</Text>
        </TouchableOpacity>
      </View>

      {/* Grille 2x2 de statistiques */}
      <View style={styles.statsGrid}>
        {/* Note moyenne */}
        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={24} color="#FBBF24" />
          <Text style={styles.statValue}>
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>

        {/* Clients actifs */}
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{stats.activeClients}</Text>
          <Text style={styles.statLabel}>Clients actifs</Text>
        </View>

        {/* Revenus mensuels */}
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#10B981" />
          <Text style={styles.statValue}>{stats.monthlyRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}€</Text>
          <Text style={styles.statLabel}>Revenus mensuels</Text>
        </View>

        {/* Taux de retour */}
        <View style={styles.statCard}>
          <Ionicons name="repeat-outline" size={24} color="#8B5CF6" />
          <Text style={styles.statValue}>{stats.returnRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Taux de retour</Text>
        </View>
      </View>

      {/* Informations de l'établissement */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Informations de l'établissement</Text>

        {/* Description */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Description</Text>
          <Text style={styles.infoValue}>
            {store.description || store.partner?.description || 'Aucune description disponible.'}
          </Text>
        </View>

        {/* Adresse */}
        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>{formatAddress()}</Text>
            </View>
          </View>
        </View>

        {/* Téléphone */}
        {(store.phoneNumber || store.phone || store.partner?.phoneNumber) && (
          <View style={styles.infoItem}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={Colors.text.secondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>
                  {store.phoneNumber || store.phone || store.partner?.phoneNumber}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Email */}
        {(store.email || store.partner?.email) && (
          <View style={styles.infoItem}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={Colors.text.secondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {store.email || store.partner?.email}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Horaires */}
        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={Colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Horaires</Text>
              <Text style={styles.infoValue}>{formatHours()}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    paddingTop: 0,
  } as ViewStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  } as TextStyle,
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  } as ViewStyle,
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  } as TextStyle,
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  } as TextStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  } as ViewStyle,
  headerLeft: {
    flex: 1,
    gap: Spacing.sm,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  categoryBadge: {
    backgroundColor: '#EF4444',
  } as ViewStyle,
  verifiedBadge: {
    backgroundColor: '#10B981',
  } as ViewStyle,
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  } as TextStyle,
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  ratingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  locationText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  changeButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  infoSection: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  } as TextStyle,
  infoItem: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  } as ViewStyle,
  infoContent: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 2,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    lineHeight: 22,
  } as TextStyle,
});

