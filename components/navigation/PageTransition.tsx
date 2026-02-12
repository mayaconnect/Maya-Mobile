import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

interface PageTransitionProps {
  children: React.ReactNode;
  index?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, index = 0 }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    // Animation d'entrée fluide
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
    });

    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
