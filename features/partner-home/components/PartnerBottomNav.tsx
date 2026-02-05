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
    <>
      {/* Bouton Scanner en dehors du container pour qu'il ne soit pas coupé */}
      <View style={styles.scanButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={onScanQR}
          disabled={validatingQR || !onScanQR}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#8B2F3F', '#6B1F2F', '#8B2F3F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanButtonGradient}
          >
            <View style={styles.scanButtonInner}>
              {validatingQR ? (
                <Ionicons name="hourglass" size={32} color="#FFFFFF" />
              ) : (
                <Ionicons name="qr-code" size={32} color="#FFFFFF" />
              )}
            </View>
            {/* Effet de brillance */}
            <View style={styles.scanButtonShine} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
    </>
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
    left: '50%',
    marginLeft: -38, // Moitié de la largeur du bouton (76/2) pour centrer
    bottom: 50, // Positionné au-dessus de la navbar (50px du bas de l'écran)
    zIndex: 1000, // Très élevé pour être au-dessus de tout
    width: 76,
    height: 76,
  } as ViewStyle,
  scanButtonSpacer: {
    width: 76, // Même largeur que le bouton pour centrer les sections
  } as ViewStyle,
  scanButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    ...Shadows.xl,
    elevation: 30,
  } as ViewStyle,
  scanButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    position: 'relative',
  } as ViewStyle,
  scanButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 2,
  } as ViewStyle,
  scanButtonShine: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  } as ViewStyle,
});

