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

interface SubscriptionHeaderProps {
  title: string;
  subtitle: string;
  currentPlan?: string;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  style?: any;
}

export function SubscriptionHeader({
  title,
  subtitle,
  currentPlan,
  onBackPress,
  onNotificationPress,
  style
}: SubscriptionHeaderProps) {
  return (
    <LinearGradient
      colors={['#312E81', '#1E1B4B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Header principal */}
      <View style={styles.header}>
        {onBackPress && (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={16} color={Colors.text.light} />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        
        <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
          <Ionicons name="notifications" size={16} color={Colors.text.light} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>1</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Plan actuel */}
      {currentPlan && (
        <View style={styles.planContainer}>
          <View style={styles.planCard}>
            <View style={styles.planIcon}>
              <Ionicons name="diamond" size={18} color={Colors.text.light} />
            </View>
            <View style={styles.planContent}>
              <Text style={styles.planLabel}>Plan actuel</Text>
              <Text style={styles.planName}>{currentPlan}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Actif</Text>
            </View>
          </View>
        </View>
      )}
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
  backButton: {
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
  planContainer: {
    alignItems: 'center',
  } as ViewStyle,
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  planIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  planContent: {
    flex: 1,
  } as ViewStyle,
  planLabel: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 2,
  } as TextStyle,
  planName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  } as ViewStyle,
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.status.success,
  } as TextStyle,
});
