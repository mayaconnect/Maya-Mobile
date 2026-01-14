import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/design-system';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface NeoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'glass' | 'solid';
  gradient?: readonly string[];
}

export function NeoCard({ children, style, variant = 'glass', gradient }: NeoCardProps) {
  if (variant === 'glass') {
    return (
      <View style={[styles.glassCard, style]}>
        {children}
      </View>
    );
  }

  const cardGradient = gradient || Colors.gradients.darkPink;
  
  return (
    <LinearGradient
      colors={cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientCard, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.lg,
    // Effet glassmorphism moderne
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  } as ViewStyle,
  gradientCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.xl,
    // Ombre plus prononcée pour les cartes gradient
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  } as ViewStyle,
});

