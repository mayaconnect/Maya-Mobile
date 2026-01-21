/**
 * Utilitaires pour le code splitting et le lazy loading
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/design-system';

/**
 * Composant de fallback pour Suspense
 */
export const SuspenseFallback: React.FC<{ message?: string }> = ({ message = 'Chargement...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={Colors.primary[600]} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

/**
 * Wrapper pour les composants lazy avec Suspense
 */
export function withSuspense<P extends object>(
  Component: LazyExoticComponent<ComponentType<P>>,
  fallback?: React.ReactNode
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <SuspenseFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Crée un composant lazy avec Suspense intégré
 */
export function createLazyComponent<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(loader);
  return withSuspense(LazyComponent, fallback);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
});

