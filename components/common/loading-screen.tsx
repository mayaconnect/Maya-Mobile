import { Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export function LoadingScreen({ 
  message = "Chargement...", 
  showLogo = true 
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Maya</Text>
          <Text style={styles.logoSubtext}>Économisez avec vos partenaires</Text>
        </View>
      )}
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
      
      <View style={styles.footer}>
        <Ionicons name="heart" size={16} color={Colors.text.secondary} />
        <Text style={styles.footerText}>Fait avec amour pour vous</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  } as ViewStyle,
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  } as ViewStyle,
  logoText: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: '800',
    color: Colors.primary[600],
    marginBottom: Spacing.sm,
  } as TextStyle,
  logoSubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  loadingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    fontWeight: '500',
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  footerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  } as TextStyle,
});




