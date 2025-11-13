import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/design-system';

type NeoCardVariant = 'surface' | 'glass';

interface NeoCardProps {
  gradient?: readonly string[];
  variant?: NeoCardVariant;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  gradient,
  variant = 'surface',
  style,
  children,
}) => {
  if (gradient) {
    return (
      <LinearGradient colors={gradient} style={[styles.cardBase, style]}>
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.cardBase,
        variant === 'glass' ? styles.glassCard : styles.surfaceCard,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  surfaceCard: {
    backgroundColor: Colors.background.card,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});

export default NeoCard;

