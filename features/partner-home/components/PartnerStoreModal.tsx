import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface PartnerStoreModalProps {
  visible: boolean;
  selectedStore: any | null;
  loading: boolean;
  onClose: () => void;
}

export function PartnerStoreModal({ visible, selectedStore, loading, onClose }: PartnerStoreModalProps) {
  const insets = useSafeAreaInsets();
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
      <LinearGradient
        colors={Colors.gradients.primary as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <BlurView intensity={30} tint="dark" style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View style={styles.closeButtonInner}>
                <Ionicons name="chevron-down" size={24} color={Colors.text.light} />
              </View>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails du magasin</Text>
            <View style={styles.placeholder} />
          </BlurView>

          {selectedStore && (
            <ScrollView 
              style={styles.modalContent} 
              contentContainerStyle={[
                styles.modalContentContainer,
                { paddingBottom: Math.max(insets.bottom, Spacing.xl) }
              ]}
              showsVerticalScrollIndicator={false}
            >
              {loading && (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={Colors.text.light} />
                  <Text style={styles.modalLoadingText}>Chargement...</Text>
                </View>
              )}

              {/* Header du magasin */}
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <BlurView intensity={20} tint="dark" style={styles.storeHeaderCard}>
                  <View style={styles.storeHeaderTop}>
                    <View style={styles.storeIconContainer}>
                      <View style={styles.storeIcon}>
                        <Ionicons name="storefront-outline" size={32} color={Colors.text.light} />
                      </View>
                      {selectedStore.isActive && (
                        <View style={styles.activeBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.status.success} />
                        </View>
                      )}
                    </View>
                    <View style={styles.storeHeaderInfo}>
                      <Text style={styles.storeName} numberOfLines={2}>
                        {selectedStore.name || selectedStore.partner?.name || 'Magasin sans nom'}
                      </Text>
                      {selectedStore.category && (
                        <View style={styles.categoryTag}>
                          <Ionicons name="pricetag-outline" size={12} color={Colors.text.secondary} />
                          <Text style={styles.categoryTagText}>{selectedStore.category}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.storeHeaderBadges}>
                    {discountPercent && (
                      <View style={styles.headerBadge}>
                        <Ionicons name="gift-outline" size={14} color={Colors.status.success} />
                        <Text style={styles.headerBadgeText}>-{discountPercent}%</Text>
                      </View>
                    )}
                    {selectedStore.isOpen !== undefined && (
                      <View style={[styles.headerBadge, selectedStore.isOpen ? styles.headerBadgeOpen : styles.headerBadgeClosed]}>
                        <View style={[styles.statusDot, { backgroundColor: selectedStore.isOpen ? Colors.status.success : Colors.status.error }]} />
                        <Text style={[styles.headerBadgeText, { color: selectedStore.isOpen ? Colors.status.success : Colors.status.error }]}>
                          {selectedStore.isOpen ? 'Ouvert' : 'Fermé'}
                        </Text>
                      </View>
                    )}
                  </View>
                </BlurView>
              </Animated.View>

              {/* Informations de contact */}
              <Animated.View entering={FadeInUp.delay(200).springify()}>
                <BlurView intensity={15} tint="dark" style={styles.infoCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.text.light} />
                    <Text style={styles.sectionTitle}>Informations</Text>
                  </View>
                  
                  <View style={styles.infoList}>
                    {selectedStore.address && (
                      <View style={styles.infoItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons name="location-outline" size={18} color={Colors.text.light} />
                        </View>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Adresse</Text>
                          {selectedStore.address.street && (
                            <Text style={styles.infoText}>{selectedStore.address.street}</Text>
                          )}
                          <Text style={styles.infoText}>
                            {[selectedStore.address.postalCode, selectedStore.address.city]
                              .filter(Boolean)
                              .join(' ')}
                          </Text>
                        </View>
                      </View>
                    )}

                    {(selectedStore.phone || selectedStore.phoneNumber) && (
                      <View style={styles.infoItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons name="call-outline" size={18} color={Colors.text.light} />
                        </View>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Téléphone</Text>
                          <Text style={styles.infoText}>
                            {selectedStore.phone || selectedStore.phoneNumber}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedStore.email && (
                      <View style={styles.infoItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons name="mail-outline" size={18} color={Colors.text.light} />
                        </View>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Email</Text>
                          <Text style={styles.infoText}>{selectedStore.email}</Text>
                        </View>
                      </View>
                    )}

                    {(selectedStore.website || selectedStore.url) && (
                      <View style={styles.infoItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons name="globe-outline" size={18} color={Colors.text.light} />
                        </View>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Site web</Text>
                          <Text style={styles.infoText} numberOfLines={1}>
                            {selectedStore.website || selectedStore.url}
                          </Text>
                        </View>
                      </View>
                    )}

                    {(selectedStore.openingHours || selectedStore.hours) && (
                      <View style={styles.infoItem}>
                        <View style={styles.infoIconBox}>
                          <Ionicons name="time-outline" size={18} color={Colors.text.light} />
                        </View>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Horaires</Text>
                          <Text style={styles.infoText}>
                            {typeof (selectedStore.openingHours || selectedStore.hours) === 'string'
                              ? (selectedStore.openingHours || selectedStore.hours)
                              : 'Voir sur place'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </BlurView>
              </Animated.View>

              {/* Statistiques */}
              {hasStats && (
                <Animated.View entering={FadeInUp.delay(300).springify()}>
                  <BlurView intensity={15} tint="dark" style={styles.statsCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="stats-chart-outline" size={18} color={Colors.text.light} />
                      <Text style={styles.sectionTitle}>Statistiques</Text>
                    </View>
                    <View style={styles.statsGrid}>
                      {selectedStore.totalScans !== undefined && (
                        <View style={styles.statItem}>
                          <View style={styles.statIconBox}>
                            <Ionicons name="qr-code-outline" size={20} color={Colors.status.success} />
                          </View>
                          <Text style={styles.statValue}>{selectedStore.totalScans}</Text>
                          <Text style={styles.statLabel}>Scans</Text>
                        </View>
                      )}
                      {selectedStore.totalRevenue !== undefined && (
                        <View style={styles.statItem}>
                          <View style={styles.statIconBox}>
                            <Ionicons name="cash-outline" size={20} color={Colors.accent.gold} />
                          </View>
                          <Text style={styles.statValue}>
                            {selectedStore.totalRevenue.toFixed(0)}€
                          </Text>
                          <Text style={styles.statLabel}>Revenus</Text>
                        </View>
                      )}
                      {selectedStore.clientsCount !== undefined && (
                        <View style={styles.statItem}>
                          <View style={styles.statIconBox}>
                            <Ionicons name="people-outline" size={20} color={Colors.accent.cyan} />
                          </View>
                          <Text style={styles.statValue}>{selectedStore.clientsCount}</Text>
                          <Text style={styles.statLabel}>Clients</Text>
                        </View>
                      )}
                    </View>
                  </BlurView>
                </Animated.View>
              )}

              {/* Description */}
              {selectedStore.description && (
                <Animated.View entering={FadeInUp.delay(400).springify()}>
                  <BlurView intensity={15} tint="dark" style={styles.descriptionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="document-text-outline" size={18} color={Colors.text.light} />
                      <Text style={styles.sectionTitle}>Description</Text>
                    </View>
                    <Text style={styles.descriptionText}>
                      {selectedStore.description}
                    </Text>
                  </BlurView>
                </Animated.View>
              )}

              {/* Partenaire rattaché */}
              {selectedStore.partner && (
                <Animated.View entering={FadeInUp.delay(500).springify()}>
                  <BlurView intensity={15} tint="dark" style={styles.partnerCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="business-outline" size={18} color={Colors.text.light} />
                      <Text style={styles.sectionTitle}>Partenaire</Text>
                    </View>
                    <View style={styles.partnerInfoRow}>
                      <View style={styles.partnerIconBox}>
                        <Ionicons name="briefcase-outline" size={20} color={Colors.text.light} />
                      </View>
                      <View style={styles.partnerInfo}>
                        <Text style={styles.partnerName}>
                          {selectedStore.partner.name || 'N/A'}
                        </Text>
                        {selectedStore.partner.email && (
                          <Text style={styles.partnerEmail}>
                            {selectedStore.partner.email}
                          </Text>
                        )}
                      </View>
                    </View>
                  </BlurView>
                </Animated.View>
              )}

              {/* Promotion active */}
              {(selectedStore.activePromotion || selectedStore.promotion) && (
                <Animated.View entering={FadeInUp.delay(600).springify()}>
                  <BlurView intensity={15} tint="dark" style={styles.promotionCard}>
                    <View style={styles.promotionHeader}>
                      <View style={styles.promotionIconBox}>
                        <Ionicons name="sparkles-outline" size={20} color={Colors.accent.rose} />
                      </View>
                      <View style={styles.promotionContent}>
                        <Text style={styles.promotionLabel}>Promotion active</Text>
                        <Text style={styles.promotionDiscount}>
                          {(selectedStore.activePromotion || selectedStore.promotion).discount ||
                            (selectedStore.activePromotion || selectedStore.promotion).discountLabel ||
                            `-${discountPercent ?? 10}%`}
                        </Text>
                        <Text style={styles.promotionDescription}>
                          {(selectedStore.activePromotion || selectedStore.promotion).description ||
                            'Réduction immédiate sur l addition du client.'}
                        </Text>
                      </View>
                    </View>
                  </BlurView>
                </Animated.View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width: '100%',
  } as ViewStyle,
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    opacity: 0.15,
  } as ViewStyle,
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: Colors.accent.rose,
    top: -60,
    right: -70,
  } as ViewStyle,
  circle2: {
    width: 160,
    height: 160,
    backgroundColor: Colors.accent.gold,
    top: '30%',
    left: -50,
  } as ViewStyle,
  circle3: {
    width: 140,
    height: 140,
    backgroundColor: Colors.accent.emerald,
    bottom: 100,
    right: -40,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    zIndex: 10,
  } as ViewStyle,
  closeButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  closeButtonInner: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  } as TextStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  modalContent: {
    flex: 1,
  } as ViewStyle,
  modalContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexGrow: 1,
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
  storeHeaderCard: {
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  storeHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  storeIconContainer: {
    position: 'relative',
  } as ViewStyle,
  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  activeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'rgba(26, 10, 14, 0.9)',
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.status.success,
  } as ViewStyle,
  storeHeaderInfo: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    lineHeight: 24,
  } as TextStyle,
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  } as ViewStyle,
  categoryTagText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  storeHeaderBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  } as ViewStyle,
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  headerBadgeOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  } as ViewStyle,
  headerBadgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  } as ViewStyle,
  headerBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontWeight: '600',
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
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statsSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  statsCard: {
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  } as ViewStyle,
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.1,
  } as TextStyle,
  infoCard: {
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  infoList: {
    gap: Spacing.sm,
  } as ViewStyle,
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  } as ViewStyle,
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  infoTextContainer: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 2,
  } as TextStyle,
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    lineHeight: 18,
  } as TextStyle,
  descriptionCard: {
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  descriptionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    lineHeight: 20,
    marginTop: Spacing.sm,
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
  partnerCard: {
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  partnerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  } as ViewStyle,
  partnerIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  partnerInfo: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  partnerName: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  partnerEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
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
  promotionCard: {
        borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  promotionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  } as ViewStyle,
  promotionIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  promotionContent: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  promotionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  promotionDiscount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    color: Colors.accent.rose,
  } as TextStyle,
  promotionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    lineHeight: 18,
  } as TextStyle,
});

