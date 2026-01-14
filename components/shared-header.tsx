import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SharedHeaderProps {
  title: string;
  subtitle?: string;
  onPartnerModePress?: () => void;
  showPartnerMode?: boolean;
  showFamilyBadge?: boolean;
  onSearchPress?: () => void;
  balanceEuros?: string;
  variant?: 'home' | 'partners' | 'subscription' | 'history' | 'profile';
  gradientColors?: readonly [string, string] | readonly [string, string, ...string[]];
  rightSlot?: React.ReactNode;
}

export function SharedHeader({ 
  title, 
  subtitle, 
  onPartnerModePress, 
  showPartnerMode = true,
  showFamilyBadge = true,
  onSearchPress,
  balanceEuros,
  variant,
  gradientColors,
  rightSlot,
}: SharedHeaderProps) {
  return (
    <LinearGradient
      colors={gradientColors ?? (['#6B1F2F', '#7B2F3F', '#8B2F3F'] as const)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color={Colors.text.light} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Ionicons name="notifications" size={16} color={Colors.text.light} />
              <View style={styles.bellBadge} />
            </TouchableOpacity>
          </View>

          {balanceEuros && (
            <View style={styles.balancePill}>
              <Ionicons name="wallet" size={14} color={Colors.status.success} />
              <Text style={styles.balanceText}>{balanceEuros}</Text>
            </View>
          )}

          

          {rightSlot ? (
            <View>{rightSlot}</View>
          ) : (
            showPartnerMode && (
              <TouchableOpacity style={styles.partnerModeButton} onPress={onPartnerModePress}>
                <Ionicons name="home" size={14} color={Colors.accent.orange} />
                <Text style={styles.partnerModeText}>Mode Partenaire</Text>
              </TouchableOpacity>
            )
          )}

          {showFamilyBadge && (
            <View style={styles.familyContainer}>
              <Text style={styles.familyText}>Famille</Text>
            </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flex: 1,
  } as ViewStyle,
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  } as ViewStyle,
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  } as TextStyle,
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  } as ViewStyle,
  bellBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.status.error,
    borderWidth: 1.5,
    borderColor: Colors.text.light,
  } as ViewStyle,
  balancePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  } as ViewStyle,
  balanceText: {
    color: Colors.status.success,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  searchPlaceholder: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: Typography.sizes.base,
  } as TextStyle,
  scanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  scanChipText: {
    color: '#8B2F3F',
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  partnerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  } as ViewStyle,
  partnerModeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.accent.orange,
  } as TextStyle,
  familyContainer: {
    alignItems: 'flex-end',
    marginTop: Spacing.md,
  } as ViewStyle,
  familyText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    fontWeight: '500',
  } as TextStyle,
});
