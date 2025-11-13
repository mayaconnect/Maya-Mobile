import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';

type NeoChipTone = 'neutral' | 'positive' | 'warning';

interface NeoChipProps {
  label: string;
  tone?: NeoChipTone;
  style?: ViewStyle;
}

const toneStyles: Record<NeoChipTone, { background: string; color: string }> = {
  neutral: {
    background: 'rgba(255,255,255,0.08)',
    color: Colors.text.secondary,
  },
  positive: {
    background: 'rgba(39,239,161,0.15)',
    color: Colors.secondary[300],
  },
  warning: {
    background: 'rgba(255,159,104,0.18)',
    color: Colors.accent.orange,
  },
};

export const NeoChip: React.FC<NeoChipProps> = ({ label, tone = 'neutral', style }) => {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.container, { backgroundColor: palette.background }, style]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  },
});

export default NeoChip;

