/**
 * Maya Connect V2 — Client Tab Layout
 *
 * Custom animated tab bar with:
 *  • Orange accent on active tab
 *  • Haptic feedback
 *  • Floating QR code center button
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { clientColors as colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { wp, isIOS } from '../../src/utils/responsive';
import { usePushNotifications } from '../../src/hooks/use-push-notifications';

export default function ClientTabLayout() {
  // Register push notifications when client is authenticated
  usePushNotifications();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: wp(11),
          marginTop: wp(-2),
        },
        tabBarStyle: {
          backgroundColor: isIOS ? 'transparent' : '#0F172A',
          borderTopWidth: 0,
          elevation: 0,
          height: wp(80),
          paddingBottom: isIOS ? wp(24) : wp(8),
          paddingTop: wp(8),
          position: 'absolute',
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={wp(22)} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />

      <Tabs.Screen
        name="partners"
        options={{
          title: 'Partenaires',
          tabBarIcon: ({ color }) => (
            <Ionicons name="storefront" size={wp(22)} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />

      <Tabs.Screen
        name="qrcode"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.qrIconContainer,
                focused && styles.qrIconActive,
              ]}
            >
              <Ionicons
                name="qr-code"
                size={wp(26)}
                color={focused ? '#FFF' : colors.orange[500]}
              />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => (
            <Ionicons name="time" size={wp(22)} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={wp(22)} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />

      {/* Hidden screens accessible from tabs */}
      <Tabs.Screen
        name="subscription"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="stores-map"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="partner-details"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="change-password"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="payment-methods"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  qrIconContainer: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(26),
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: wp(-20),
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  qrIconActive: {
    backgroundColor: colors.orange[500],
  },
});
