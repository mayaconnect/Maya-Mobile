/**
 * Maya Connect V2 — Partner Tab Layout
 *
 * Bottom tabs for Partner / StoreOperator role:
 * Dashboard | Scanner | Historique | Magasins | Profil
 * Floating center scanner button (like client QR).
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { partnerColors as colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { spacing, shadows } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { usePartnerInit } from '../../src/hooks/use-partner-init';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabDef {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TABS: TabDef[] = [
  { name: 'dashboard', title: 'Dashboard', icon: 'grid-outline', iconFocused: 'grid' },
  { name: 'history', title: 'Historique', icon: 'receipt-outline', iconFocused: 'receipt' },
  { name: 'scanner', title: 'Scanner', icon: 'scan-outline', iconFocused: 'scan' },
  { name: 'stores', title: 'Magasins', icon: 'storefront-outline', iconFocused: 'storefront' },
  { name: 'profile', title: 'Profil', icon: 'person-outline', iconFocused: 'person' },
];

export default function PartnerLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Populate partner Zustand store from auth user's partnerData
  usePartnerInit();

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
          height: wp(80) + insets.bottom,
          paddingTop: spacing[2],
          borderTopWidth: 0,
          backgroundColor: isIOS ? 'transparent' : '#111827',
          ...shadows.xl,
          elevation: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      {TABS.map((tab, i) => {
        const isCenter = i === 2; // Scanner is center (index 2 of 5)
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, color }) =>
                isCenter ? (
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
              tabBarLabel: isCenter ? '' : tab.title,
            }}
            listeners={{
              tabPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              },
            }}
          />
        );
      })}

      {/* Hidden screen — accessible via router.push, not shown in tab bar */}
      <Tabs.Screen
        name="team"
        options={{
          href: null,          // hides from tab bar
          title: 'Mon équipe',
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
