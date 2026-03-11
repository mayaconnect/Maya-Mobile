/**
 * KPICard — Reusable stat/KPI display card for partner screens.
 *
 * Usage:
 *   <KPICard icon="scan" label="Scans" value="142" color={colors.violet[500]} />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MCard } from '../ui';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

interface KPICardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  /** Accent color for icon background & icon. Defaults to navy (violet[500]). */
  color?: string;
  /** Background tint for the icon circle. Defaults to violet[50]. */
  tint?: string;
  /** Trend indicator, e.g. "+12%" */
  trend?: string;
  trendPositive?: boolean;
}

export function KPICard({
  icon,
  label,
  value,
  color = colors.violet[500],
  tint = colors.violet[50],
  trend,
  trendPositive = true,
}: KPICardProps) {
  return (
    <MCard style={styles.card} elevation="sm">
      <View style={[styles.iconBox, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={wp(20)} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend ? (
        <Text
          style={[
            styles.trend,
            { color: trendPositive ? colors.success[500] : colors.error[500] },
          ]}
        >
          {trend}
        </Text>
      ) : null}
    </MCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  iconBox: {
    width: wp(36),
    height: wp(36),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  value: {
    ...textStyles.h4,
    color: colors.neutral[900],
  },
  label: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  trend: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    marginTop: spacing[1],
  },
});
