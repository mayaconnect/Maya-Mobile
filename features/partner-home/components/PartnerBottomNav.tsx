import { BorderRadius, Shadows, Spacing } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PartnerTab = 'overview' | 'history' | 'stats' | 'me';

interface PartnerBottomNavProps {
  selectedTab: PartnerTab;
  onTabChange: (tab: PartnerTab) => void;
  onScanQR?: () => void;
  validatingQR?: boolean;
}

export function PartnerBottomNav({ selectedTab, onTabChange, onScanQR, validatingQR = false }: PartnerBottomNavProps) {
  const insets = useSafeAreaInsets();
  const tabs: { key: PartnerTab; label: string; icon: { active: string; inactive: string } }[] = [
    { key: 'overview', label: 'Home', icon: { active: 'grid', inactive: 'grid-outline' } },
    { key: 'history', label: 'Historique', icon: { active: 'time', inactive: 'time-outline' } },
    { key: 'stats', label: 'Statistiques', icon: { active: 'stats-chart', inactive: 'stats-chart-outline' } },
    { key: 'me', label: 'Me', icon: { active: 'person', inactive: 'person-outline' } },
  ];
  
  // Calculer la position du bouton pour qu'il soit entièrement visible
  const buttonBottom = Math.max(insets.bottom, 20) + 50; // 50px au-dessus de la navbar + safe area

  return (
    <View style={styles.wrapper}>
      <View style={styles.bottomNavBarContainer}>
        <LinearGradient
          colors={['#1A0A0E', '#2D0F15', '#1A0A0E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.bottomNavBar}>
            {/* Section gauche : 2 premiers onglets */}
            <View style={styles.navSection}>
              {tabs.slice(0, 2).map((tab) => {
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
                          size={24}
                          color="#FFFFFF"
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name={tab.icon.inactive as any}
                        size={22}
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

            {/* Espace pour le bouton scanner au centre */}
            <View style={styles.scanButtonSpacer} />

            {/* Section droite : 2 derniers onglets */}
            <View style={styles.navSection}>
              {tabs.slice(2).map((tab) => {
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
                          size={24}
                          color="#FFFFFF"
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name={tab.icon.inactive as any}
                        size={22}
                        color="rgba(255, 255, 255, 0.5)"
                      />
                    )}
                    <Text
                      style={[
                        styles.bottomNavText
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Bouton Scanner centré au-dessus de la navbar */}
      <View style={styles.scanButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={onScanQR}
          disabled={validatingQR || !onScanQR}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B2F3F', '#A03D52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanButtonGradient}
          >
            {validatingQR ? (
              <Ionicons name="hourglass" size={28} color="#FFFFFF" />
            ) : (
              <Ionicons name="qr-code" size={28} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  } as ViewStyle,
  bottomNavBarContainer: {
    width: '100%',
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    ...Shadows.xl,
    overflow: 'visible', // Permet au bouton de dépasser
  } as ViewStyle,
  gradient: {
    borderRadius: BorderRadius['3xl'],
    overflow: 'visible', // Permet au bouton de dépasser
  } as ViewStyle,
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: -1,
    backgroundColor: 'transparent',
    paddingBottom: Spacing.lg + 8,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    minHeight: 75,
    position: 'relative',
  } as ViewStyle,
  navSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    zIndex: 1,
  } as ViewStyle,
  bottomNavItem: {
    flex: 0.1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: Spacing.xs,
    minWidth: 60,
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
  scanButtonContainer: {
    position: 'absolute',
    top: -30,
    left: '50%',
    marginLeft: -35, // Moitié de la largeur du bouton (70/2) pour centrer
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
    zIndex: 1000,
  } as ViewStyle,
  scanButtonSpacer: {
    width: 70, // Même largeur que le bouton pour centrer les sections
  } as ViewStyle,
  scanButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'visible', // Allow shadow and border to be visible
    ...Shadows.xl,
    elevation: 20,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  scanButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Inner border
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 35, // Ensure gradient itself is circular
  } as ViewStyle,
});

