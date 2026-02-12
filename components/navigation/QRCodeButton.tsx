import { Shadows } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export const QRCodeButton: React.FC = () => {
  const router = useRouter();
  const segments = useSegments();
  const isActive = segments[segments.length - 1] === 'qrcode';

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      // Animation de pulsation continue quand actif
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
      rotate.value = withSequence(
        withTiming(5, { duration: 150 }),
        withTiming(-5, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    } else {
      scale.value = withSpring(1, { damping: 10, stiffness: 100 });
      rotate.value = withSpring(0, { damping: 10, stiffness: 100 });
    }
  }, [isActive]);

  const handlePress = () => {
    // Animation de clic
    scale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 200 }),
      withSpring(1.05, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    iconScale.value = withSequence(
      withSpring(0.8, { damping: 8, stiffness: 200 }),
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    router.push('/(tabs)/qrcode');
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#8B2F3F', '#A03D52', '#B84E66']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Animated.View style={animatedIconStyle}>
              <Ionicons name="qr-code" size={32} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Effet de halo autour du bouton */}
      {isActive && (
        <View style={styles.halo}>
          <LinearGradient
            colors={['rgba(139, 47, 63, 0.3)', 'transparent']}
            style={styles.haloGradient}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -35,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  } as ViewStyle,
  buttonWrapper: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  } as ViewStyle,
  button: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    overflow: 'hidden',
    ...Shadows.xl,
    elevation: 24,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  } as ViewStyle,
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 37.5,
  } as ViewStyle,
  halo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -22.5,
    zIndex: -1,
  } as ViewStyle,
  haloGradient: {
    flex: 1,
    borderRadius: 60,
  } as ViewStyle,
});
