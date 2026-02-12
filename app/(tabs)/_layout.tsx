import { AnimatedTabBar } from '@/components/navigation/AnimatedTabBar';
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
                    (user as any)?.role === 'StoreOperator' ||
                    (user as any)?.isPartner === true ||
                    (user as any)?.isOperator === true;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF', // Blanc pour l'icône active sur fond sombre
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', // Blanc semi-transparent pour les icônes inactives
        headerShown: false,
        tabBarStyle: isPartner ? {
          display: 'none', // Masquer la barre de navigation pour les partenaires
        } : {
          display: 'none', // Masquer la barre par défaut, on utilise notre barre personnalisée
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
      }}
      tabBar={(props) => (isPartner ? null : <AnimatedTabBar {...props} />)}>
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
        name="qrcode"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "qr-code" : "qr-code-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null, // Cacher de la barre de navigation - accessible uniquement via le profil
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

