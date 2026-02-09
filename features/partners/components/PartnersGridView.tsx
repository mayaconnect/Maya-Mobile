import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Partner } from '../types';
import { getRestaurantImage } from '../utils/restaurantImages';

interface PartnersGridViewProps {
  partners: Partner[];
  loading: boolean;
  error: string;
  onPartnerSelect: (partner: Partner) => void;
}

export const PartnersGridView: React.FC<PartnersGridViewProps> = ({
  partners,
  loading,
  error,
  onPartnerSelect,
}) => {
  const insets = useSafeAreaInsets();
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2F3F" />
        <Text style={styles.loadingText}>Chargement des partenaires…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.status.error} />
        <Text style={styles.emptyStateTitle}>Oups…</Text>
        <Text style={styles.emptyStateText}>{error}</Text>
      </View>
    );
  }

  if (partners.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="storefront-outline" size={64} color={Colors.text.secondary} />
        <Text style={styles.emptyStateTitle}>Aucun partenaire trouvé</Text>
        <Text style={styles.emptyStateText}>Essayez de modifier vos critères de recherche</Text>
      </View>
    );
  }

  return (
    <View style={styles.partnersGrid}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.partnersGridContent,
          { paddingBottom: Math.max(insets.bottom, responsiveSpacing(90)) } // Navbar height (70) + safe area + margin
        ]}
      >
        {partners.map((partner, index) => (
          <TouchableOpacity
            key={partner.id ?? index}
            style={[
              styles.gridCard,
              index % 2 === 0 && styles.gridCardLeft,
              index % 2 === 1 && styles.gridCardRight,
            ]}
            onPress={() => onPartnerSelect(partner)}
            activeOpacity={0.8}
          >
            <View style={styles.gridCardImage}>
              <Image
                source={typeof getRestaurantImage(partner.id, partner.name, partner.category, 400, 300) === 'number' 
                  ? getRestaurantImage(partner.id, partner.name, partner.category, 400, 300) as number
                  : { uri: getRestaurantImage(partner.id, partner.name, partner.category, 400, 300) as string }}
                style={styles.gridCardImageContent}
                resizeMode="cover"
              />
              {partner.promotion?.isActive && (
                <View style={styles.gridPromoBadge}>
                  <Text style={styles.gridPromoBadgeText}>{partner.promotion.discount}</Text>
                </View>
              )}
              {partner.isOpen === false && (
                <View style={styles.gridClosedOverlay}>
                  <Text style={styles.gridClosedText}>Fermé</Text>
                </View>
              )}
            </View>

            <View style={styles.gridCardInfo}>
              <Text style={styles.gridCardName} numberOfLines={1}>
                {partner.name}
              </Text>
              <View style={styles.gridCardMeta}>
                <Ionicons name="star" size={12} color={Colors.accent.gold} />
                <Text style={styles.gridCardRating}>{partner.rating?.toFixed?.(1) ?? partner.rating}</Text>
                {partner.distance !== null && partner.distance !== undefined && (
                  <Text style={styles.gridCardDistance}>• {partner.distance} km</Text>
                )}
              </View>
              <Text style={styles.gridCardAddress} numberOfLines={1}>
                {partner.address}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  partnersGrid: {
    flex: 1,
  } as ViewStyle,
  partnersGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  gridCard: {
    width: '48%',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.md,
  } as ViewStyle,
  gridCardLeft: {
    marginRight: '2%',
  } as ViewStyle,
  gridCardRight: {
    marginRight: 0,
  } as ViewStyle,
  gridCardImage: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(139, 47, 63, 0.1)',
    overflow: 'hidden',
  } as ViewStyle,
  gridCardImageContent: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  gridPromoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.status.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.status.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  } as ViewStyle,
  gridPromoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
  } as TextStyle,
  gridClosedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  gridClosedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  } as TextStyle,
  gridCardInfo: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  } as ViewStyle,
  gridCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  gridCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  } as ViewStyle,
  gridCardRating: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  gridCardDistance: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  gridCardAddress: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 14,
  } as TextStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  } as TextStyle,
  emptyStateText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});

