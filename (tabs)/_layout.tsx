import { BorderRadius, Spacing } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { user, loading } = useAuth();
  
  // Attendre que le chargement soit terminé avant de rediriger
  if (loading) {
    return null; // Ou un écran de chargement
  }
  
  if (!user) {
    return <Redirect href="/connexion/login" />;
  }

  // Vérifier si l'utilisateur est un partenaire ou un opérateur
  const isPartner = user?.email?.toLowerCase().includes('partner') || 
                    user?.email?.toLowerCase().includes('partenaire') ||
                    user?.email?.toLowerCase().includes('operator') ||
                    user?.email?.toLowerCase().includes('opérateur') ||
                    (user as any)?.role === 'partner' ||
                    (user as any)?.role === 'operator' ||
                    (user as any)?.role === 'opérateur' ||
                    (user as any)?.isPartner === true ||
                    (user as any)?.isOperator === true;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#8B2F3F', // Couleur du design system pour l'icône active
        tabBarInactiveTintColor: '#1A0A0E', // Même couleur que le fond de l'application
        headerShown: false,
        tabBarStyle: isPartner ? {
          display: 'none', // Masquer la barre de navigation pour les partenaires
        } : {
          backgroundColor: '#FFFFFF', // Fond blanc
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)', // Bordure subtile pour délimiter
          paddingBottom: Spacing.md,
          paddingTop: Spacing.md,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
          borderTopLeftRadius: BorderRadius.xl,
          borderTopRightRadius: BorderRadius.xl,
          position: 'absolute',
          left: Spacing.sm,
          right: Spacing.sm,
          bottom: Spacing.sm,
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
          title: 'Historique',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
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
      <Tabs.Screen
        name="stores-map"
        options={{
          href: null, // Cacher de la barre de navigation
        }}
      />
    </Tabs>
  );
}
