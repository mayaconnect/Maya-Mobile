/**
 * Maya Connect V2 — MDivider
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface MDividerProps {
  label?: string;
  style?: ViewStyle;
}

export const MDivider: React.FC<MDividerProps> = ({ label, style }) => {
  if (!label) {
    return <View style={[styles.line, style]} />;
  }
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[4],
  },
  label: {
    ...textStyles.caption,
    color: colors.neutral[400],
    marginHorizontal: spacing[3],
  },
});
