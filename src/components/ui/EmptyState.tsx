/**
 * Maya Connect V2 — EmptyState
 *
 * Illustrated empty state with optional action button.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MButton } from './MButton';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'albums-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={wp(40)} color={colors.orange[400]} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {actionLabel && onAction && (
      <MButton
        title={actionLabel}
        onPress={onAction}
        variant="outline"
        size="sm"
        fullWidth={false}
        style={styles.button}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
  },
  iconCircle: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...textStyles.h4,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    maxWidth: wp(280),
  },
  button: {
    marginTop: spacing[5],
  },
});
