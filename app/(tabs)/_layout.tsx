import { useAuth } from '@/hooks/use-auth';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { user } = useAuth();
  if (!user) {
    return <Redirect href="/login" />;
  }

  const isPartner =
    user?.email?.toLowerCase().includes('partner') ||
    user?.email?.toLowerCase().includes('partenaire') ||
    (user as any)?.role === 'partner' ||
    (user as any)?.isPartner === true;

  const tabBarStyle = {
    position: 'absolute' as const,
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.md,
    height: 72,
    borderRadius: BorderRadius['3xl'],
    backgroundColor: 'rgba(17,17,23,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
  };

  return (
    <Tabs
      initialRouteName={isPartner ? 'partner-home' : 'home'}
      screenOptions={{
        tabBarActiveTintColor: Colors.accent.rose,
        tabBarInactiveTintColor: Colors.text.muted,
        headerShown: false,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.weights.semibold as any,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          borderRadius: BorderRadius.lg,
        },
        sceneStyle: {
          backgroundColor: Colors.background.dark,
        },
      }}
    >
      <Tabs.Screen
        name="partner-home"
        options={{
          title: 'QR',
          href: isPartner ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          href: !isPartner ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: 'Partenaires',
          href: !isPartner ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Abonnement',
          href: !isPartner ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Statistiques',
          href: isPartner ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          href: !isPartner ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
