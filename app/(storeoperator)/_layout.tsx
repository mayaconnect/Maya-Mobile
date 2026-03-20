/**
 * Maya Connect V2 — Store Operator Tab Layout
 *
 * Bottom tabs for StoreOperator role:
 * Dashboard | Scanner (centre) | Mes magasins | Historique | Profil
 */
import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { operatorColors as colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { spacing, shadows } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { usePartnerInit } from '../../src/hooks/use-partner-init';
import { usePushNotifications } from '../../src/hooks/use-push-notifications';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabDef {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TABS: TabDef[] = [
  { name: 'dashboard', title: 'Accueil', icon: 'home-outline', iconFocused: 'home' },
  { name: 'history', title: 'Historique', icon: 'receipt-outline', iconFocused: 'receipt' },
  { name: 'scanner', title: 'Scanner', icon: 'scan-outline', iconFocused: 'scan' },
  { name: 'my-stores', title: 'Magasins', icon: 'storefront-outline', iconFocused: 'storefront' },
  { name: 'profile', title: 'Profil', icon: 'person-outline', iconFocused: 'person' },
];

export default function StoreOperatorLayout() {
  const insets = useSafeAreaInsets();

  // Populate partner Zustand store from auth user's partnerData
  usePartnerInit();

  // Register push notifications when operator is authenticated
  usePushNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.violet[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: wp(10),
          marginTop: wp(-2),
        },
        tabBarStyle: {
          position: 'absolute',
          height: wp(62) + insets.bottom,
          paddingTop: spacing[1],
          borderTopWidth: 0,
          backgroundColor: isIOS ? 'transparent' : '#FFFFFF',
          ...shadows.xl,
          elevation: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      {TABS.map((tab) => {
        const isScanner = tab.name === 'scanner';
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, color }) =>
                isScanner ? (
                  <View style={styles.scannerBtn}>
                    <Ionicons name="scan" size={wp(26)} color="#FFFFFF" />
                  </View>
                ) : (
                  <Ionicons
                    name={focused ? tab.iconFocused : tab.icon}
                    size={wp(22)}
                    color={color}
                  />
                ),
              tabBarLabel: isScanner ? '' : tab.title,
            }}
            listeners={{
              tabPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              },
            }}
          />
        );
      })}

      {/* Hidden screen: store management (accessible via router.push) */}
      <Tabs.Screen
        name="edit-profile"
        options={{ href: null, title: 'Modifier le profil' }}
      />
      <Tabs.Screen
        name="change-password"
        options={{ href: null, title: 'Changer le mot de passe' }}
      />
      <Tabs.Screen
        name="store-management"
        options={{
          href: null, // hide from tab bar
          title: 'Gestion du magasin',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scannerBtn: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: colors.violet[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: wp(-20),
    ...shadows.lg,
  },
});
