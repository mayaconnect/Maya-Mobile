import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerQuickActionsProps {
  onScanClient?: () => void;
  onViewStats?: () => void;
}

export const PartnerQuickActions: React.FC<PartnerQuickActionsProps> = ({
  onScanClient,
  onViewStats,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actions rapides</Text>
      
      <View style={styles.actionsRow}>
        {/* Bouton principal - Scanner client */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onScanClient}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B2F3F', '#A03D52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Ionicons name="qr-code" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Scanner client</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bouton secondaire - Voir stats */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onViewStats}
          activeOpacity={0.7}
        >
          <Ionicons name="stats-chart" size={24} color={Colors.text.light} />
          <Text style={styles.secondaryButtonText}>Voir stats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  } as TextStyle,
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  primaryButton: {
    flex: 2,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  } as ViewStyle,
  primaryButtonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 80,
  } as ViewStyle,
  primaryButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  } as TextStyle,
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 80,
  } as ViewStyle,
  secondaryButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
});

