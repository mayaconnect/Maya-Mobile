/**
 * Maya Connect V2 — ErrorState Component
 *
 * Reusable error display with retry support.
 * Shows when an API call fails, giving users a clear action.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MButton } from './MButton';

interface ErrorStateProps {
  /** Main error message */
  title?: string;
  /** Additional context / instructions */
  description?: string;
  /** Ionicons icon name */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Retry handler — shows "Réessayer" button if provided */
  onRetry?: () => void;
  /** Custom retry label */
  retryLabel?: string;
  /** Render full screen (centered) or inline */
  fullScreen?: boolean;
  /** Extra style */
  style?: ViewStyle;
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger les données. Vérifiez votre connexion et réessayez.',
  icon = 'cloud-offline-outline',
  onRetry,
  retryLabel = 'Réessayer',
  fullScreen = false,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={wp(32)} color={colors.error[500]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {onRetry ? (
        <MButton
          title={retryLabel}
          onPress={onRetry}
          variant="outline"
          size="sm"
          icon={<Ionicons name="refresh" size={wp(16)} color={colors.orange[500]} />}
          style={styles.retryBtn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...textStyles.h4,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    ...textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    maxWidth: wp(280),
    marginBottom: spacing[4],
  },
  retryBtn: {
    marginTop: spacing[2],
  },
});
