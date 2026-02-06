import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface HomeQuickActionsProps {
  onScanQR?: () => void;
}

export const HomeQuickActions: React.FC<HomeQuickActionsProps> = ({ onScanQR }) => {
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.quickActionGradient}
        onPress={onScanQR || (() => router.push('/(tabs)/qrcode'))}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8B2F3F', '#A03D52']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <View style={styles.quickActionIconBg}>
            <Ionicons name="qr-code" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.quickActionTextGradient}>Scanner QR</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => router.push('/(tabs)/partners')}
        activeOpacity={0.7}
      >
        <View style={styles.quickActionIconBg}>
          <Ionicons name="location" size={26} color="#3B82F6" />
        </View>
        <Text style={styles.quickActionText}>Trouver partenaires</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  quickActionGradient: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  } as ViewStyle,
  gradientButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    minHeight: 70,
    justifyContent: 'center',
  } as ViewStyle,
  quickActionTextGradient: {
    marginTop: Spacing.xs,
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    textAlign: 'center',
  } as TextStyle,
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    backgroundColor: 'transparent',
  } as ViewStyle,
  quickActionText: {
    marginTop: 2,
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    textAlign: 'center',
  } as TextStyle,
  quickActionSubtext: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  } as TextStyle,
});

