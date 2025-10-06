import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { PartnerPromotion } from './partner-promotion';

export interface Partner {
  id: number;
  name: string;
  rating: number;
  description: string;
  address: string;
  distance: number;
  isOpen: boolean;
  closingTime: string;
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
  const handleGoThere = () => {
    console.log(`Aller à ${partner.name}`);
  };

  const handleUsePromotion = () => {
    console.log(`Utiliser la promotion chez ${partner.name}`);
  };

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>{partner.image}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{partner.name}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={16} color={Colors.accent.gold} />
            <Text style={styles.ratingText}>{partner.rating}</Text>
          </View>
        </View>

        <Text style={styles.description}>{partner.description}</Text>

        <View style={styles.location}>
          <Ionicons name="location" size={14} color={Colors.text.secondary} />
          <Text style={styles.address}>{partner.address}</Text>
          <Text style={styles.distance}>{partner.distance} km</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusChip, partner.isOpen ? styles.statusOpen : styles.statusClosed]}>
              <Ionicons 
                name="time" 
                size={12} 
                color={partner.isOpen ? Colors.status.success : Colors.status.error} 
              />
              <Text style={[
                styles.statusText,
                { color: partner.isOpen ? Colors.status.success : Colors.status.error }
              ]}>
                {partner.isOpen ? 'Ouvert' : 'Fermé'}
              </Text>
              {partner.isOpen && (
                <Text style={styles.closingTime}>{partner.closingTime}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.goButton} onPress={handleGoThere}>
            <Ionicons name="location" size={16} color={Colors.text.light} />
            <Text style={styles.goButtonText}>Y aller</Text>
          </TouchableOpacity>
        </View>

        {partner.promotion && partner.promotion.isActive && (
          <PartnerPromotion
            promotion={partner.promotion}
            onUsePromotion={handleUsePromotion}
            style={styles.promotion}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    ...Shadows.md,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  imageContainer: {
    marginRight: Spacing.md,
  } as ViewStyle,
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  imageText: {
    fontSize: 24,
    color: Colors.text.primary,
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  name: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  } as TextStyle,
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  ratingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  } as TextStyle,
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  } as TextStyle,
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
    color: Colors.text.secondary,
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  } as ViewStyle,
  statusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  closingTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  } as TextStyle,
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  } as ViewStyle,
  goButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  promotion: {
    marginTop: Spacing.sm,
  } as ViewStyle,
});