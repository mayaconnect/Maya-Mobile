/**
 * Maya Connect V2 — LoadingSpinner
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  color?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  fullScreen = false,
  color = colors.orange[500],
  size = 'large',
  style,
}) => (
  <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
    <ActivityIndicator size={size} color={color} />
    {message && <Text style={styles.message}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  message: {
    ...textStyles.body,
    color: colors.neutral[500],
    marginTop: spacing[3],
  },
});
