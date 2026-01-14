import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { PartnerPromotion } from './partner-promotion';

export interface Partner {
  id: string;
  name: string;
  rating: number;
  description: string;
  address: string;
  distance: number | null;
  isOpen: boolean;
  closingTime: string | null;
  category: string;
  image: string;
  promotion?: {
    discount: string;
    description: string;
    isActive: boolean;
  } | null;
}

interface PartnerCardProps {
  partner: Partner;
  onPress?: () => void;
  style?: any;
}

export function PartnerCard({ partner, onPress, style }: PartnerCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleGoThere = () => {
    console.log(`Aller à ${partner.name}`);
  };

  const handleUsePromotion = () => {
    console.log(`Utiliser la promotion chez ${partner.name}`);
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Header avec image et rating */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageText}>{partner.image}</Text>
            </View>
            {partner.promotion?.isActive && (
              <View style={styles.promotionBadge}>
                <Text style={styles.promotionBadgeText}>{partner.promotion.discount}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>{partner.name}</Text>
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color={Colors.accent.gold} />
                <Text style={styles.ratingText}>
                  {Number.isFinite(partner.rating) ? partner.rating.toFixed(1) : '4.0'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.category}>{partner.category}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {partner.description}
        </Text>

        {/* Location et distance */}
        <View style={styles.locationRow}>
          <View style={styles.location}>
            <Ionicons name="location" size={14} color={Colors.text.secondary} />
            <Text style={styles.address} numberOfLines={1}>{partner.address}</Text>
          </View>
          <Text style={styles.distance}>
            {partner.distance != null ? `${partner.distance} km` : '—'}
          </Text>
        </View>

        {/* Status et actions */}
        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusChip, 
              partner.isOpen ? styles.statusOpen : styles.statusClosed
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: partner.isOpen ? Colors.status.success : Colors.status.error }
              ]} />
              <Text style={[
                styles.statusText,
                { color: partner.isOpen ? Colors.status.success : Colors.status.error }
              ]}>
                {partner.isOpen ? 'Ouvert' : 'Fermé'}
              </Text>
              {partner.isOpen && partner.closingTime && (
                <Text style={styles.closingTime}>• {partner.closingTime}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.goButton} onPress={handleGoThere}>
            <Ionicons name="navigate" size={16} color={Colors.text.light} />
            <Text style={styles.goButtonText}>Y aller</Text>
          </TouchableOpacity>
        </View>

        {/* Promotion */}
        {partner.promotion && partner.promotion.isActive && (
          <PartnerPromotion
            promotion={partner.promotion}
            onUsePromotion={handleUsePromotion}
            style={styles.promotion}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  imageContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  } as ViewStyle,
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.4)',
  } as ViewStyle,
  imageText: {
    fontSize: 28,
    color: Colors.text.light,
  } as TextStyle,
  promotionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.status.success,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center',
  } as ViewStyle,
  promotionBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  } as ViewStyle,
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  name: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    flex: 1,
    marginRight: Spacing.sm,
  } as TextStyle,
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.gold + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  } as ViewStyle,
  ratingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.accent.gold,
  } as TextStyle,
  category: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  } as TextStyle,
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  address: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
  distance: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#8B2F3F',
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  statusContainer: {
    flex: 1,
  } as ViewStyle,
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  } as ViewStyle,
  statusOpen: {
    backgroundColor: Colors.status.success + '15',
  } as ViewStyle,
  statusClosed: {
    backgroundColor: Colors.status.error + '15',
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  closingTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B2F3F',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  goButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  promotion: {
    marginTop: Spacing.md,
  } as ViewStyle,
});