import { BorderRadius, Spacing, Typography } from '@/constants/design-system';
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

interface ProfileHeaderProps {
  title: string;
  subtitle: string;
  userEmail?: string;
  onSettingsPress?: () => void;
  onNotificationPress?: () => void;
  style?: any;
}

export function ProfileHeader({
  title,
  subtitle,
  userEmail,
  onSettingsPress,
  onNotificationPress,
  style
}: ProfileHeaderProps) {
  return (
    <LinearGradient
      colors={['#8B2F3F', '#7B1F2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Header principal */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
          <Ionicons name="settings" size={20} color="white" />
        </TouchableOpacity>
        
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        
        <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
          <Ionicons name="notifications" size={20} color="white" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Informations utilisateur */}
      {userEmail && (
        <View style={styles.userInfoContainer}>
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userEmail.split('@')[0]}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  settingsButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.95,
  } as TextStyle,
  notificationButton: {
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
  userInfoContainer: {
    alignItems: 'center',
  } as ViewStyle,
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md + 4,
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  avatar: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  } as ViewStyle,
  userDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
  } as ViewStyle,
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  userEmail: {
    fontSize: Typography.sizes.base,
    color: 'white',
    fontWeight: '600',
    opacity: 0.9,
  } as TextStyle,
  editButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,
});
