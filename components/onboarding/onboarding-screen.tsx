import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { AnimatedParticles } from './animated-particles';

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
  const logoScale = useSharedValue(1);
  const logoOpacity = useSharedValue(0);

  React.useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Animated background elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>

      {/* Particules animées */}
      <AnimatedParticles particleCount={20} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {showBack ? (
            <TouchableOpacity 
              onPress={onBack} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <BlurView intensity={20} style={styles.blurButton} tint="light">
                <View style={styles.backButtonInner}>
                  <Ionicons name="arrow-back" size={18} color="white" />
                  <Text style={styles.backText}>Retour</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Text style={styles.appName}>Maya</Text>
            <View style={styles.logoUnderline} />
          </Animated.View>
          
          {showSkip ? (
            <TouchableOpacity 
              onPress={onSkip} 
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <BlurView intensity={20} style={styles.blurButton} tint="light">
                <Text style={styles.skipText}>Passer</Text>
              </BlurView>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.15,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: Colors.accent.rose,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: Colors.accent.emerald,
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: Colors.accent.gold,
    top: height * 0.4,
    right: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.light,
    letterSpacing: Typography.letterSpacing.wide,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  logoUnderline: {
    width: 60,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  backButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  blurButton: {
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.sm,
  },
  backButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  skipButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  skipText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  placeholder: {
    width: 100,
  },
});
