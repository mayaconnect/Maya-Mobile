import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface SlideTransitionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function SlideTransition({ 
  children, 
  delay = 0, 
  direction = 'right' 
}: SlideTransitionProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 600 });
      
      switch (direction) {
        case 'right':
          translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
          break;
        case 'left':
          translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
          break;
        case 'up':
          translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
          break;
        case 'down':
          translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
          break;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, direction]);

  const getInitialPosition = () => {
    switch (direction) {
      case 'right':
        return { translateX: 300, translateY: 0 };
      case 'left':
        return { translateX: -300, translateY: 0 };
      case 'up':
        return { translateX: 0, translateY: -300 };
      case 'down':
        return { translateX: 0, translateY: 300 };
      default:
        return { translateX: 300, translateY: 0 };
    }
  };

  const initialPosition = getInitialPosition();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
    };
  });

  // Initialiser les valeurs
  React.useEffect(() => {
    translateX.value = initialPosition.translateX;
    translateY.value = initialPosition.translateY;
  }, []);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
