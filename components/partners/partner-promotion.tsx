import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface Promotion {
  discount: string;
  description: string;
  isActive: boolean;
}

interface PartnerPromotionProps {
  promotion: Promotion;
  onUsePromotion: () => void;
  style?: any;
}

export function PartnerPromotion({ promotion, onUsePromotion, style }: PartnerPromotionProps) {
  if (!promotion.isActive) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.discountTag}>
          <Text style={styles.discountText}>{promotion.discount}</Text>
        </View>

        <Text style={styles.description}>{promotion.description}</Text>

        <TouchableOpacity style={styles.useButton} onPress={onUsePromotion}>
          <Text style={styles.useButtonText}>Utiliser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: Colors.status.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  discountTag: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  } as ViewStyle,
  discountText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  description: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: '500',
  } as TextStyle,
  useButton: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  } as ViewStyle,
  useButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
});