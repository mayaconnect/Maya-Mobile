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
      colors={gradientColors ?? (['#8B5CF6', '#A855F7', '#EC4899'] as const)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={Colors.primary[600]} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Ionicons name="notifications" size={20} color={Colors.text.light} />
              <View style={styles.bellBadge} />
            </TouchableOpacity>
          </View>

          {balanceEuros && (
            <View style={styles.balancePill}>
              <Ionicons name="wallet" size={16} color="#10B981" />
              <Text style={styles.balanceText}>{balanceEuros}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.searchBar} onPress={onSearchPress} activeOpacity={0.8}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Rechercher un partenaire ou une catégorie</Text>
            <View style={styles.scanChip}>
              <Ionicons name="scan" size={14} color="#8B5CF6" />
              <Text style={styles.scanChipText}>Scanner</Text>
            </View>
          </TouchableOpacity>

          {rightSlot ? (
            <View>{rightSlot}</View>
          ) : (
            showPartnerMode && (
              <TouchableOpacity style={styles.partnerModeButton} onPress={onPartnerModePress}>
                <Ionicons name="home" size={16} color="#F59E0B" />
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
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    minHeight: 200, // Hauteur minimale pour plus d'espace
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    flex: 1,
  } as ViewStyle,
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: 'bold',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    lineHeight: 48,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.xl,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 28,
  } as TextStyle,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  } as ViewStyle,
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  } as ViewStyle,
  balancePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  } as ViewStyle,
  balanceText: {
    color: '#10B981',
    fontSize: Typography.sizes.base,
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
    color: '#8B5CF6',
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  partnerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  partnerModeText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: '#F59E0B',
  } as TextStyle,
  familyContainer: {
    alignItems: 'flex-end',
    marginTop: Spacing.xl,
  } as ViewStyle,
  familyText: {
    fontSize: Typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  } as TextStyle,
});
