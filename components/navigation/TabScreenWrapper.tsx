/**
 * TabScreenWrapper
 * Wrapper component pour ajouter la navbar animée aux écrans de tabs
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import AnimatedNavbar from './AnimatedNavbar';
import { useTabNavigation } from '@/hooks/use-tab-navigation';
import { useAuth } from '@/hooks/use-auth';

interface TabScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function TabScreenWrapper({ children, style }: TabScreenWrapperProps) {
  const { navItems, activeIndex } = useTabNavigation();
  const { user } = useAuth();

  // Vérifier si l'utilisateur est un partenaire
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
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {children}
      </View>

      {/* Navbar animée (masquée pour les partenaires) */}
      {!isPartner && (
        <AnimatedNavbar
          items={navItems}
          activeIndex={activeIndex}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
