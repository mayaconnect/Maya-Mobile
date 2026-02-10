/**
 * Exemple d'utilisation de AnimatedNavbar
 *
 * Ce fichier montre différentes façons d'utiliser le composant AnimatedNavbar
 * dans l'application Maya.
 */

import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import AnimatedNavbar, { NavItem } from './AnimatedNavbar';
import { Colors } from '@/constants/design-system';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXEMPLE 1 : Utilisation de base avec gestion d'état
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function BasicExample() {
  const [activeTab, setActiveTab] = useState(0);

  const navItems: NavItem[] = [
    { key: 'home', icon: 'home' },
    { key: 'explore', icon: 'globe' },
    { key: 'qr', icon: 'qr' },
    { key: 'profile', icon: 'profile' },
  ];

  const screens = ['Accueil', 'Explorer', 'QR Code', 'Profil'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.dark} />

      {/* Contenu de la page */}
      <View style={styles.content}>
        <ThemedText type="title" style={styles.screenTitle}>
          {screens[activeTab]}
        </ThemedText>
        <ThemedText type="default" style={styles.screenSubtitle}>
          Vous êtes sur l'écran {screens[activeTab]}
        </ThemedText>
      </View>

      {/* Barre de navigation */}
      <AnimatedNavbar
        items={navItems}
        activeIndex={activeTab}
        onTabChange={setActiveTab}
      />
    </SafeAreaView>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXEMPLE 2 : Avec actions personnalisées par item
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CustomActionsExample() {
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');

  const navItems: NavItem[] = [
    {
      key: 'home',
      icon: 'home',
      onPress: () => {
        setMessage('Navigation vers Accueil');
        setActiveTab(0);
      }
    },
    {
      key: 'partners',
      icon: 'globe',
      onPress: () => {
        setMessage('Navigation vers Partenaires');
        setActiveTab(1);
      }
    },
    {
      key: 'qr',
      icon: 'qr',
      onPress: () => {
        setMessage('Ouverture du scanner QR');
        setActiveTab(2);
        // Ici vous pourriez ouvrir une modal de scan QR
      }
    },
    {
      key: 'profile',
      icon: 'profile',
      onPress: () => {
        setMessage('Navigation vers Profil');
        setActiveTab(3);
      }
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.screenTitle}>
          Actions personnalisées
        </ThemedText>
        {message ? (
          <ThemedText type="default" style={styles.screenSubtitle}>
            {message}
          </ThemedText>
        ) : null}
      </View>

      <AnimatedNavbar
        items={navItems}
        activeIndex={activeTab}
      />
    </SafeAreaView>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXEMPLE 3 : Avec React Navigation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Exemple d'intégration avec React Navigation
 *
 * À utiliser dans votre _layout.tsx ou TabLayout
 */

/*
import { useRouter, usePathname } from 'expo-router';

export function NavigationExample() {
  const router = useRouter();
  const pathname = usePathname();

  // Déterminer l'index actif basé sur le pathname
  const getActiveIndex = () => {
    if (pathname === '/home' || pathname === '/') return 0;
    if (pathname === '/partners') return 1;
    if (pathname === '/qrcode') return 2;
    if (pathname === '/profile') return 3;
    return 0;
  };

  const navItems: NavItem[] = [
    {
      key: 'home',
      icon: 'home',
      onPress: () => router.push('/home'),
    },
    {
      key: 'partners',
      icon: 'globe',
      onPress: () => router.push('/partners'),
    },
    {
      key: 'qr',
      icon: 'qr',
      onPress: () => router.push('/qrcode'),
    },
    {
      key: 'profile',
      icon: 'profile',
      onPress: () => router.push('/profile'),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="home" />
        <Stack.Screen name="partners" />
        <Stack.Screen name="qrcode" />
        <Stack.Screen name="profile" />
      </Stack>

      <AnimatedNavbar
        items={navItems}
        activeIndex={getActiveIndex()}
      />
    </View>
  );
}
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXEMPLE 4 : Navigation Maya complète (3 items)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function MayaNavExample() {
  const [activeTab, setActiveTab] = useState(0);

  // Configuration Maya : Accueil, QR, Profil
  const navItems: NavItem[] = [
    { key: 'home', icon: 'home' },
    { key: 'qr', icon: 'qr' },
    { key: 'profile', icon: 'profile' },
  ];

  const screens = [
    { title: 'Accueil', emoji: '🏠', subtitle: 'Bienvenue sur Maya' },
    { title: 'QR Code', emoji: '📱', subtitle: 'Scanner un QR code' },
    { title: 'Profil', emoji: '👤', subtitle: 'Votre profil' },
  ];

  const currentScreen = screens[activeTab];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.dark} />

      <View style={styles.content}>
        <ThemedText style={styles.emoji}>{currentScreen.emoji}</ThemedText>
        <ThemedText type="title" style={styles.screenTitle}>
          {currentScreen.title}
        </ThemedText>
        <ThemedText type="default" style={styles.screenSubtitle}>
          {currentScreen.subtitle}
        </ThemedText>
      </View>

      <AnimatedNavbar
        items={navItems}
        activeIndex={activeTab}
        onTabChange={setActiveTab}
      />
    </SafeAreaView>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXEMPLE 5 : Mode non contrôlé
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function UncontrolledExample() {
  const navItems: NavItem[] = [
    { key: 'home', icon: 'home' },
    { key: 'explore', icon: 'globe' },
    { key: 'settings', icon: 'settings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.screenTitle}>
          Mode non contrôlé
        </ThemedText>
        <ThemedText type="default" style={styles.screenSubtitle}>
          Le composant gère son propre état
        </ThemedText>
      </View>

      <AnimatedNavbar
        items={navItems}
        onTabChange={(index) => {
          console.log('Tab changed to:', index);
        }}
      />
    </SafeAreaView>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Styles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.accent.gold,
    marginBottom: 12,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Export par défaut pour tester rapidement
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default MayaNavExample;
