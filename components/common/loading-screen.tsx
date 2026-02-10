import { Colors, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import {
    ActivityIndicator,
    Image,
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
  message, 
  showLogo = true 
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo2.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        {message && (
          <Text style={styles.loadingText}>{message}</Text>
        )}
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
    marginBottom: Spacing.xl * 3,
  } as ViewStyle,
  logo: {
    width: 120,
    height: 120,
  } as ViewStyle,
  loadingContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '400',
  } as TextStyle,
});




