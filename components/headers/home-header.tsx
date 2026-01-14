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

interface HomeHeaderProps {
  title: string;
  subtitle: string;
  balanceEuros: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  style?: any;
}

export function HomeHeader({
  title,
  subtitle,
  balanceEuros,
  onNotificationPress,
  onProfilePress,
  style
}: HomeHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#8B2F3F', '#7B1F2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, style]}
      >
        {/* Header principal */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
            <Ionicons name="person" size={16} color={Colors.text.light} />
          </TouchableOpacity>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          
          <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
            <Ionicons name="notifications" size={16} color={Colors.text.light} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet" size={18} color={Colors.status.success} />
            </View>
            <View style={styles.balanceContent}>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceAmount}>{balanceEuros}</Text>
            </View>
            <TouchableOpacity style={styles.rechargeButton}>
              <Ionicons name="add" size={16} color={Colors.text.light} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#8B2F3F',
  } as ViewStyle,
  container: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
    minHeight: 60,
  } as ViewStyle,
  profileButton: {
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
  balanceContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  balanceIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  balanceContent: {
    flex: 1,
  } as ViewStyle,
  balanceLabel: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 2,
  } as TextStyle,
  balanceAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  rechargeButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
});
