import { BorderRadius, Spacing } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface PartnersHeaderProps {
  title: string;
  subtitle: string;
  totalPartners: number;
  nearbyPartners: number;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  style?: any;
}

export function PartnersHeader({
  title,
  subtitle,
  totalPartners,
  nearbyPartners,
  onLocationPress,
  onNotificationPress,
  style
}: PartnersHeaderProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  return (
    <LinearGradient
      colors={['#6366F1', '#4F46E5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onLocationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={20} color="white" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiques rapides - Design épuré */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="business" size={16} color="white" />
            <Text style={styles.statValue}>{totalPartners}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="location" size={16} color="white" />
            <Text style={styles.statValue}>{nearbyPartners}</Text>
            <Text style={styles.statLabel}>À proximité</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="gift" size={16} color="white" />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Promotions</Text>
          </View>
        </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  } as ViewStyle,
  titleSection: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 2,
  } as TextStyle,
  subtitle: {
    fontSize: 13,
    color: 'white',
    fontWeight: '500',
    opacity: 0.9,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  } as ViewStyle,
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  } as ViewStyle,
  notificationText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'white',
  } as TextStyle,
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.xs,
    paddingHorizontal: 0,
    marginTop: Spacing.sm,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 2,
  } as ViewStyle,
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    marginTop: 2,
  } as TextStyle,
  statLabel: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    opacity: 0.85,
    textAlign: 'center',
  } as TextStyle,
});
