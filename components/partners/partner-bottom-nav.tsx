import { BorderRadius, Shadows, Spacing } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

export type PartnerTab = 'overview' | 'history' | 'stats' | 'me';

interface PartnerBottomNavProps {
  selectedTab: PartnerTab;
  onTabChange: (tab: PartnerTab) => void;
}

export function PartnerBottomNav({ selectedTab, onTabChange }: PartnerBottomNavProps) {
  const tabs: { key: PartnerTab; label: string; icon: { active: string; inactive: string } }[] = [
    { key: 'overview', label: 'Home', icon: { active: 'grid', inactive: 'grid-outline' } },
    { key: 'history', label: 'Historique', icon: { active: 'time', inactive: 'time-outline' } },
    { key: 'stats', label: 'Statistiques', icon: { active: 'stats-chart', inactive: 'stats-chart-outline' } },
    { key: 'me', label: 'Me', icon: { active: 'person', inactive: 'person-outline' } },
  ];

  return (
    <View style={styles.bottomNavBarContainer}>
      <LinearGradient
        colors={['#1A0A0E', '#2D0F15', '#1A0A0E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.bottomNavBar}>
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]}
                onPress={() => onTabChange(tab.key)}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <View style={styles.activeIndicator}>
                    <Ionicons
                      name={tab.icon.active as any}
                      size={26}
                      color="#FFFFFF"
                    />
                    <View style={styles.activeDot} />
                  </View>
                ) : (
                  <Ionicons
                    name={tab.icon.inactive as any}
                    size={24}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                )}
                <Text
                  style={[
                    styles.bottomNavText,
                    isActive && styles.bottomNavTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    ...Shadows.xl,
    overflow: 'hidden',
  } as ViewStyle,
  gradient: {
    borderRadius: BorderRadius['3xl'],
  } as ViewStyle,
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: Spacing.md,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
    minHeight: 70,
  } as ViewStyle,
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  } as ViewStyle,
  bottomNavItemActive: {
    // Style pour l'item actif
  } as ViewStyle,
  activeIndicator: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  bottomNavText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    marginTop: 2,
  } as TextStyle,
  bottomNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  } as TextStyle,
});

