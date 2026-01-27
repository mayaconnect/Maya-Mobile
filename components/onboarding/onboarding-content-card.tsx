import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface OnboardingContentCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  imageSource?: any;
  gradientColors?: string[];
  delay?: number;
}

export function OnboardingContentCard({ 
  icon, 
  title, 
  description, 
  imageSource,
  gradientColors = ['#7B1F2F', '#8B2F3F'],
  delay = 0
}: OnboardingContentCardProps) {
  const iconScale = useSharedValue(0.8);
  const iconRotation = useSharedValue(-10);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const descriptionOpacity = useSharedValue(0);
  const descriptionTranslateY = useSharedValue(30);
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    // Card entrance animation
    cardOpacity.value = withTiming(1, { duration: 400 });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 100 });

    // Icon animation with bounce
    iconScale.value = withDelay(
      delay + 200,
      withSpring(1, { damping: 8, stiffness: 100 })
    );
    iconRotation.value = withDelay(
      delay + 200,
      withSpring(0, { damping: 10, stiffness: 100 })
    );

    // Title animation
    titleOpacity.value = withDelay(
      delay + 400,
      withTiming(1, { duration: 500 })
    );
    titleTranslateY.value = withDelay(
      delay + 400,
      withSpring(0, { damping: 12, stiffness: 100 })
    );

    // Description animation
    descriptionOpacity.value = withDelay(
      delay + 600,
      withTiming(1, { duration: 500 })
    );
    descriptionTranslateY.value = withDelay(
      delay + 600,
      withSpring(0, { damping: 12, stiffness: 100 })
    );

    // Shimmer effect
    shimmerProgress.value = withDelay(
      delay + 800,
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 0 })
      )
    );
  }, [delay]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` }
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: descriptionTranslateY.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-200, 200]
    );
    return {
      transform: [{ translateX }],
      opacity: interpolate(shimmerProgress.value, [0, 0.5, 1], [0, 0.3, 0]),
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Shimmer effect */}
          <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.contentWrapper}>
            <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
              {icon}
            </Animated.View>
            
            <Animated.Text style={[styles.title, titleAnimatedStyle]}>
              {title}
            </Animated.Text>
            
            <Animated.Text style={[styles.description, descriptionAnimatedStyle]}>
              {description}
            </Animated.Text>
            
            {imageSource && (
              <Animated.View style={[styles.imageContainer, descriptionAnimatedStyle]}>
                <BlurView intensity={10} style={styles.imageBlur}>
                  <Image source={imageSource} style={styles.image} resizeMode="cover" />
                </BlurView>
              </Animated.View>
            )}
          </View>
          
          <View style={styles.decorativeElements}>
            <Animated.View style={[styles.circle1, iconAnimatedStyle]} />
            <Animated.View style={[styles.circle2, descriptionAnimatedStyle]} />
            <Animated.View style={[styles.circle3, titleAnimatedStyle]} />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 40,
    overflow: 'hidden',
    minHeight: height * 0.68,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 30,
    },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 3,
  },
  contentWrapper: {
    padding: 36,
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    lineHeight: 44,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 32,
    fontWeight: '400',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  imageContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 240,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  circle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: -70,
    right: -70,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: 120,
    left: -50,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  circle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: 220,
    right: 30,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});
