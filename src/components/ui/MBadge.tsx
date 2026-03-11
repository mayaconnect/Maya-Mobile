/**
 * Maya Connect V2 — MBadge
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange' | 'violet';

interface MBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const BG: Record<BadgeVariant, string> = {
  default: colors.neutral[100],
  success: '#ECFDF5',
  warning: '#FFFBEB',
  error: '#FEF2F2',
  info: '#EFF6FF',
  orange: colors.orange[50],
  violet: colors.violet[50],
};

const FG: Record<BadgeVariant, string> = {
  default: colors.neutral[700],
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  orange: colors.orange[600],
  violet: colors.violet[600],
};

export const MBadge: React.FC<MBadgeProps> = ({
  label,
  variant = 'default',
  size = 'sm',
  style,
}) => (
  <View
    style={[
      styles.badge,
      { backgroundColor: BG[variant] },
      size === 'md' && styles.md,
      style,
    ]}
  >
    <Text
      style={[
        size === 'sm' ? styles.textSm : styles.textMd,
        { color: FG[variant] },
      ]}
    >
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  md: {
    paddingHorizontal: spacing[3],
    paddingVertical: wp(4),
  },
  textSm: {
    ...textStyles.micro,
    fontWeight: '600',
  },
  textMd: {
    ...textStyles.caption,
    fontWeight: '600',
  },
});
