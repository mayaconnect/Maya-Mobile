import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  size: number;
  duration: number;
  delay: number;
  startX: number;
  startY: number;
}

interface AnimatedParticlesProps {
  particleCount?: number;
}

export function AnimatedParticles({ particleCount = 15 }: AnimatedParticlesProps) {
  const particles: Particle[] = React.useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3000 + 2000,
      delay: Math.random() * 2000,
      startX: Math.random() * width,
      startY: Math.random() * height,
    }));
  }, [particleCount]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Particle key={particle.id} particle={particle} />
      ))}
    </View>
  );
}

function Particle({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Animation de mouvement vertical avec oscillation horizontale
    translateY.value = withRepeat(
      withSequence(
        withTiming(
          -height * 0.3 - particle.startY,
          {
            duration: particle.duration,
            easing: Easing.linear,
          }
        ),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    // Oscillation horizontale
    translateX.value = withRepeat(
      withSequence(
        withTiming(30, {
          duration: particle.duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(-30, {
          duration: particle.duration / 2,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );

    // Opacité pulsante
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.2, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Scale pulsant
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          left: particle.startX,
          top: particle.startY,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.particleGlow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  particleGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 9999,
  },
});


