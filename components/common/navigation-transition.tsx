import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

interface NavigationTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  delay?: number;
}

export function NavigationTransition({ 
  children, 
  direction = 'right',
  delay = 0 
}: NavigationTransitionProps) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    // Démarrer immédiatement sans délai pour éviter le fond noir
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value }
      ],
    };
  });

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
