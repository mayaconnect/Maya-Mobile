/**
 * Maya Connect V2 — Partner Tab Layout (dark redesign)
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily } from '../../src/theme/typography';
import { shadows } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { usePartnerInit } from '../../src/hooks/use-partner-init';
import { usePushNotifications } from '../../src/hooks/use-push-notifications';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS = [
  { name: 'dashboard', title: 'Accueil',  icon: 'grid-outline'      as IoniconsName, iconActive: 'grid'       as IoniconsName },
  { name: 'team',      title: 'Équipe',   icon: 'people-outline'    as IoniconsName, iconActive: 'people'     as IoniconsName },
  { name: 'scanner',   title: 'Scan',     icon: 'scan-outline'      as IoniconsName, iconActive: 'scan'       as IoniconsName },
  { name: 'stores',    title: 'Magasins', icon: 'storefront-outline' as IoniconsName, iconActive: 'storefront' as IoniconsName },
  { name: 'profile',   title: 'Profil',   icon: 'person-outline'    as IoniconsName, iconActive: 'person'     as IoniconsName },
];

/* ── Custom tab bar ── */
function PartnerTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Only show the 5 visible tabs (first 5 routes)
  const visibleRoutes = state.routes.slice(0, 5);

  return (
    <View style={[tbStyles.wrapper, { paddingBottom: insets.bottom, height: wp(50) + insets.bottom }]}>
      {/* Background */}
      {isIOS ? (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, tbStyles.bg]} />

      {/* Tabs */}
      <View style={tbStyles.row}>
        {visibleRoutes.map((route, i) => {
          const tabDef = TABS[i];
          if (!tabDef) return null;

          const focused = state.index === i;
          const isCenter = i === 2;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              <TouchableOpacity key={route.key} style={tbStyles.centerWrap} onPress={onPress} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#4F46E5', '#818CF8']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={tbStyles.scanBtn}
                >
                  <Ionicons name="scan" size={wp(24)} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} style={tbStyles.tabItem} onPress={onPress} activeOpacity={0.7}>

              <Ionicons
                name={focused ? tabDef.iconActive : tabDef.icon}
                size={wp(22)}
                color={focused ? '#6366F1' : 'rgba(255,255,255,0.35)'}
              />
              <Text style={[tbStyles.label, focused && tbStyles.labelActive]}>
                {tabDef.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function PartnerLayout() {
  usePartnerInit();
  usePushNotifications();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PartnerTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}

      {/* Hidden screens */}
      <Tabs.Screen name="edit-profile"      options={{ href: null, title: 'Modifier le profil' }} />
      <Tabs.Screen name="change-password"   options={{ href: null, title: 'Changer le mot de passe' }} />
      <Tabs.Screen name="history"           options={{ href: null, title: 'Historique' }} />
      <Tabs.Screen name="store-management"  options={{ href: null, title: 'Gestion du magasin' }} />
    </Tabs>
  );
}

const tbStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...shadows.xl,
  },
  bg: {
    backgroundColor: isIOS ? 'rgba(13,14,32,0.8)' : '#0D0E20',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  /* Regular tab */
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: wp(9.5),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.3)',
  },
  labelActive: {
    color: '#6366F1',
    fontFamily: fontFamily.semiBold,
  },

  /* Center scanner */
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: wp(-22),
  },
  scanBtn: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    borderWidth: 3,
    borderColor: '#0D0E20',
  },
});
