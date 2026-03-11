/**
 * Maya Connect V2 — GradientBackground
 *
 * Full-screen gradient background with SafeArea support.
 */
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '../../theme/colors';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'orange' | 'violet' | 'subtle' | 'dark';
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

const GRADIENT_MAP: Record<string, readonly string[]> = {
  orange: gradients.primary,
  violet: gradients.accent,
  subtle: [colors.orange[50], '#FFFFFF', '#FFFFFF'],
  dark: [colors.neutral[900], colors.neutral[800]],
};

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'subtle',
  style,
  edges = ['top', 'bottom'],
}) => (
  <LinearGradient
    colors={GRADIENT_MAP[variant] as [string, string, ...string[]]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={[styles.gradient, style]}
  >
    <SafeAreaView edges={edges} style={styles.safe}>
      {children}
    </SafeAreaView>
  </LinearGradient>
);

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
