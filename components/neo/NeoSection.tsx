import { Colors, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface NeoSectionProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const NeoSection: React.FC<NeoSectionProps> = ({
  title,
  subtitle,
  actionLabel,
  onPressAction,
  style,
  children,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actionLabel ? (
          <TouchableOpacity onPress={onPressAction} activeOpacity={0.7}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: Typography.sizes.base,
    color: Colors.text.muted,
  },
  actionLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.secondary[400],
    fontWeight: Typography.weights.semibold as any,
  },
});

export default NeoSection;

