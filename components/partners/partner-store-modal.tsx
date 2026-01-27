import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface PartnerStoreModalProps {
  visible: boolean;
  selectedStore: any | null;
  loading: boolean;
  onClose: () => void;
}

export function PartnerStoreModal({ visible, selectedStore, loading, onClose }: PartnerStoreModalProps) {
  const discountPercent =
    selectedStore?.avgDiscountPercent ??
    selectedStore?.discountPercent ??
    selectedStore?.discount ??
    null;

  const hasStats =
    !!selectedStore?.totalScans ||
    !!selectedStore?.totalRevenue ||
    !!selectedStore?.clientsCount;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <LinearGradient
          colors={Colors.gradients.primary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="chevron-down" size={24} color={Colors.text.light} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails du magasin</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedStore && (
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
              {loading && (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={Colors.text.light} />
                  <Text style={styles.modalLoadingText}>Chargement...</Text>
                </View>
              )}

              {/* Hero + résumé */}
              <View style={styles.storeDetailCard}>
                <View style={styles.storeHeroRow}>
                  <View style={styles.storeDetailIcon}>
                    <LinearGradient
                      colors={['#FACC15', '#F97316']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.storeHeroIcon}
                    >
                      <Ionicons name="storefront" size={40} color="#1F2937" />
                    </LinearGradient>
                  </View>

                  <View style={styles.storeHeroInfo}>
                    <Text style={styles.storeDetailName} numberOfLines={2}>
                      {selectedStore.name || selectedStore.partner?.name || 'Magasin sans nom'}
                    </Text>
                    {selectedStore.category && (
                      <View style={styles.categoryPill}>
                        <Ionicons name="pricetag" size={14} color="#F97316" />
                        <Text style={styles.categoryPillText}>{selectedStore.category}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.heroBadgesRow}>
                  {discountPercent && (
                    <View style={styles.heroBadge}>
                      <Ionicons name="gift" size={16} color="#10B981" />
                      <Text style={styles.heroBadgeLabel}>Réduction</Text>
                      <Text style={styles.heroBadgeValue}>-{discountPercent}%</Text>
                    </View>
                  )}
                  {selectedStore.isOpen !== undefined && (
                    <View
                      style={[
                        styles.heroBadge,
                        selectedStore.isOpen ? styles.heroBadgeOpen : styles.heroBadgeClosed,
                      ]}
                    >
                      <View
                        style={[
                          styles.heroStatusDot,
                          { backgroundColor: selectedStore.isOpen ? '#10B981' : Colors.status.error },
                        ]}
                      />
                      <Text
                        style={[
                          styles.heroBadgeStatusText,
                          { color: selectedStore.isOpen ? '#10B981' : Colors.status.error },
                        ]}
                      >
                        {selectedStore.isOpen ? 'Ouvert maintenant' : 'Fermé'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Informations principales */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations</Text>
                <View style={styles.infoSection}>
                  {selectedStore.address && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name="location" size={20} color="#F97316" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Adresse</Text>
                        {selectedStore.address.street && (
                          <Text style={styles.infoValue}>{selectedStore.address.street}</Text>
                        )}
                        <Text style={styles.infoValue}>
                          {[selectedStore.address.postalCode, selectedStore.address.city]
                            .filter(Boolean)
                            .join(' ')}
                        </Text>
                      </View>
                    </View>
                  )}

                  {(selectedStore.phone || selectedStore.phoneNumber) && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name="call" size={20} color="#F97316" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Téléphone</Text>
                        <Text style={styles.infoValue}>
                          {selectedStore.phone || selectedStore.phoneNumber}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedStore.email && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name="mail" size={20} color="#F97316" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{selectedStore.email}</Text>
                      </View>
                    </View>
                  )}

                  {(selectedStore.website || selectedStore.url) && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name="globe" size={20} color="#F97316" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Site web</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                          {selectedStore.website || selectedStore.url}
                        </Text>
                      </View>
                    </View>
                  )}

                  {(selectedStore.openingHours || selectedStore.hours) && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons name="time" size={20} color="#F97316" />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Horaires</Text>
                        <Text style={styles.infoValue}>
                          {typeof (selectedStore.openingHours || selectedStore.hours) === 'string'
                            ? (selectedStore.openingHours || selectedStore.hours)
                            : 'Voir sur place'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Statistiques */}
              {hasStats && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Statistiques</Text>
                  <View style={styles.statsGrid}>
                    {selectedStore.totalScans !== undefined && (
                      <View style={styles.statCard}>
                        <Ionicons name="qr-code" size={22} color="#10B981" />
                        <Text style={styles.statValue}>{selectedStore.totalScans}</Text>
                        <Text style={styles.statLabel}>Scans</Text>
                      </View>
                    )}
                    {selectedStore.totalRevenue !== undefined && (
                      <View style={styles.statCard}>
                        <Ionicons name="cash" size={22} color="#FACC15" />
                        <Text style={styles.statValue}>
                          {selectedStore.totalRevenue.toFixed(0)}€
                        </Text>
                        <Text style={styles.statLabel}>Revenus</Text>
                      </View>
                    )}
                    {selectedStore.clientsCount !== undefined && (
                      <View style={styles.statCard}>
                        <Ionicons name="people" size={22} color="#60A5FA" />
                        <Text style={styles.statValue}>{selectedStore.clientsCount}</Text>
                        <Text style={styles.statLabel}>Clients</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Description */}
              {selectedStore.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.storeDetailDescriptionText}>
                    {selectedStore.description}
                  </Text>
                </View>
              )}

              {/* Partenaire rattaché */}
              {selectedStore.partner && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Partenaire</Text>
                  <View style={styles.partnerCard}>
                    <View style={styles.partnerAvatar}>
                      <Ionicons name="briefcase" size={22} color="#F97316" />
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.storeDetailPartnerName}>
                        {selectedStore.partner.name || 'N/A'}
                      </Text>
                      {selectedStore.partner.email && (
                        <Text style={styles.storeDetailPartnerEmail}>
                          {selectedStore.partner.email}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Promotion active */}
              {(selectedStore.activePromotion || selectedStore.promotion) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Promotion en cours</Text>
                  <View style={styles.promotionCard}>
                    <View style={styles.promotionHeader}>
                      <Ionicons name="sparkles" size={20} color="#FF6B6B" />
                      <Text style={styles.promotionLabel}>Offre spéciale</Text>
                    </View>
                    <Text style={styles.promotionDiscount}>
                      {(selectedStore.activePromotion || selectedStore.promotion).discount ||
                        (selectedStore.activePromotion || selectedStore.promotion).discountLabel ||
                        `-${discountPercent ?? 10}%`}
                    </Text>
                    <Text style={styles.promotionDescription}>
                      {(selectedStore.activePromotion || selectedStore.promotion).description ||
                        'Réduction immédiate sur l’addition du client.'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#13070B',
  } as ViewStyle,
  gradientBackground: {
    flex: 1,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  modalContent: {
    flex: 1,
  } as ViewStyle,
  modalContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  } as ViewStyle,
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  modalLoadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  storeDetailCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  storeHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  } as ViewStyle,
  storeDetailIcon: {
    alignItems: 'center',
  } as ViewStyle,
  storeHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    ...Shadows.md,
  } as ViewStyle,
  storeHeroInfo: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  storeDetailName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  } as ViewStyle,
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  } as ViewStyle,
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  categoryBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  discountBadgeText: {
    fontSize: Typography.sizes.xs,
    color: '#10B981',
    fontWeight: '700',
  } as TextStyle,
  statusBadgeSmall: {
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  } as ViewStyle,
  heroBadgeLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  heroBadgeValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: '700',
  } as TextStyle,
  heroBadgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  } as ViewStyle,
  heroBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  } as ViewStyle,
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  heroBadgeStatusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  } as TextStyle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statusTextSmall: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  } as TextStyle,
  infoSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  } as ViewStyle,
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(139, 47, 63, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  infoContent: {
    flex: 1,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    lineHeight: 20,
  } as TextStyle,
  statsSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.1,
  } as TextStyle,
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  storeDetailPartner: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  storeDetailPartnerName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginTop: Spacing.sm,
    marginBottom: 4,
  } as TextStyle,
  storeDetailPartnerEmail: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  storeDetailDescription: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  storeDetailDescriptionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    lineHeight: 22,
    marginTop: Spacing.sm,
  } as TextStyle,
  promotionSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  promotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  } as ViewStyle,
  promotionCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  promotionDiscount: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: '#FF6B6B',
    marginBottom: Spacing.xs,
  } as TextStyle,
  promotionDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    textAlign: 'center',
  } as TextStyle,
});

