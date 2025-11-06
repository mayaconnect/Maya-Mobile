import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  children: React.ReactNode;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  showBack?: boolean;
}

export function OnboardingScreen({ 
  children, 
  onSkip, 
  onBack, 
  showSkip = true, 
  showBack = false 
}: OnboardingScreenProps) {
  return (
    <LinearGradient
      colors={Colors.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {showBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={20} color="white" />
                <Text style={styles.backText}>Retour</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>Maya</Text>
            <View style={styles.logoUnderline} />
          </View>
          
          {showSkip ? (
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.light,
    letterSpacing: Typography.letterSpacing.wide,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoUnderline: {
    width: 50,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  backButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.xs,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  skipText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  placeholder: {
    width: 100,
  },
});
