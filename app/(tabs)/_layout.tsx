import { Shadows } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Tabs, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  
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

  // Calculer le padding bottom avec safe area
  const bottomPadding = Math.max(insets.bottom, responsiveSpacing(8));

  // Composant pour le bouton QR Code au centre
  const QRCodeTabButton = (props: BottomTabBarButtonProps) => {
    const router = useRouter();
    const segments = useSegments();
    const isActive = segments[segments.length - 1] === 'qrcode';

    return (
      <View style={styles.qrCodeButtonContainer}>
        <TouchableOpacity
          style={styles.qrCodeButton}
          onPress={() => router.push('/(tabs)/qrcode')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B2F3F', '#A03D52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.qrCodeButtonGradient}
          >
            <Ionicons 
              name="qr-code" 
              size={28} 
              color="#FFFFFF" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

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
          backgroundColor: '#1A0A0E', // Même couleur que la navbar partenaire
          borderTopWidth: 0, // Pas de bordure
          paddingBottom: bottomPadding,
          paddingTop: responsiveSpacing(12),
          height: 70 + (bottomPadding - responsiveSpacing(8)),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
          borderTopLeftRadius: responsiveSpacing(20),
          borderTopRightRadius: responsiveSpacing(20),
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
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
        name="qrcode"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "qr-code" : "qr-code-outline"} 
              size={28} 
              color={focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"} 
            />
          ),
          tabBarButton: (props) => (
            <QRCodeTabButton {...props} />
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
          href: null, // Cacher de la barre de navigation
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

const styles = StyleSheet.create({
  qrCodeButtonContainer: {
    top: -30,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
  } as ViewStyle,
  qrCodeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'visible',
    ...Shadows.xl,
    elevation: 20,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  qrCodeButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  } as ViewStyle,
});
