import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface NeoChipProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
  tone?: 'positive' | 'negative' | 'neutral';
  style?: ViewStyle;
}

export function NeoChip({ label, variant, tone = 'neutral', style }: NeoChipProps) {
  const getVariantStyle = () => {
    // Si tone est fourni, l'utiliser en priorité
    if (tone === 'positive') {
      return styles.successChip;
    }
    if (tone === 'negative') {
      return styles.warningChip;
    }
    
    // Sinon utiliser variant
    switch (variant) {
      case 'success':
        return styles.successChip;
      case 'warning':
        return styles.warningChip;
      case 'info':
        return styles.infoChip;
      default:
        return styles.defaultChip;
    }
  };

  return (
    <View style={[styles.chip, getVariantStyle(), style]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  } as ViewStyle,
  defaultChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  successChip: {
    backgroundColor: 'rgba(39, 239, 161, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(39, 239, 161, 0.4)',
  } as ViewStyle,
  warningChip: {
    backgroundColor: 'rgba(255, 159, 104, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 104, 0.4)',
  } as ViewStyle,
  infoChip: {
    backgroundColor: 'rgba(60, 75, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(60, 75, 255, 0.4)',
  } as ViewStyle,
  chipText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium as any,
    letterSpacing: 0.5,
  },
});









