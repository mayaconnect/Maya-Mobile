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

interface HistoryHeaderProps {
  title: string;
  subtitle: string;
  totalTransactions?: number;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
  style?: any;
}

export function HistoryHeader({
  title,
  subtitle,
  totalTransactions,
  onFilterPress,
  onNotificationPress,
  style
}: HistoryHeaderProps) {
  return (
    <LinearGradient
      colors={['#3730A3', '#312E81']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header principal */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
            <Ionicons name="filter" size={16} color={Colors.text.light} />
          </TouchableOpacity>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          
          <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
            <Ionicons name="notifications" size={16} color={Colors.text.light} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>5</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Statistiques rapides */}
        {totalTransactions && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="receipt" size={14} color={Colors.text.light} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{totalTransactions}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="trending-up" size={14} color={Colors.text.light} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>€{totalTransactions * 2.5}</Text>
                <Text style={styles.statLabel}>Économisé</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="star" size={14} color={Colors.accent.gold} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>4.8</Text>
                <Text style={styles.statLabel}>Note moy.</Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  } as ViewStyle,
  filterButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
    textAlign: 'center',
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
  notificationButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  } as ViewStyle,
  notificationBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.full,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.text.light,
  } as ViewStyle,
  notificationText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  statIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  statContent: {
    flex: 1,
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 1,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  } as TextStyle,
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: Spacing.xs,
  } as ViewStyle,
});
