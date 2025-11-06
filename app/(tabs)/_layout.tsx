import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { user } = useAuth();
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Vérifier si l'utilisateur est un partenaire
  const isPartner = user?.email?.toLowerCase().includes('partner') || 
                    user?.email?.toLowerCase().includes('partenaire') ||
                    (user as any)?.role === 'partner' ||
                    (user as any)?.isPartner === true;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: isPartner ? {
          display: 'none', // Masquer la barre de navigation pour les partenaires
        } : {
          backgroundColor: 'white',
          borderTopWidth: 0,
          paddingBottom: 12,
          paddingTop: 12,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
        },
        sceneStyle: { paddingBottom: 0 },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: 'Partenaires',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "storefront" : "storefront-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Abonnement',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "card" : "card-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histoire',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "time" : "time-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="partner-home"
        options={{
          href: null, // Cacher de la barre de navigation
        }}
      />
    </Tabs>
  );
}
