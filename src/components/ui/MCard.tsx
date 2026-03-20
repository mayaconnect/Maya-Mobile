/**
 * Maya Connect V2 — MCard
 *
 * Versatile card component with optional gradient header,
 * press feedback, and shadow elevation.
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface MCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  noPadding?: boolean;
}

export const MCard: React.FC<MCardProps> = ({
  children,
  onPress,
  style,
  elevation = 'md',
  noPadding = false,
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardStyle = [
    styles.card,
    shadows[elevation],
    !noPadding && styles.padding,
    style,
  ].filter(Boolean);

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[animStyle, ...cardStyle]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return <Animated.View style={[animStyle, ...cardStyle]}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  padding: {
    padding: spacing[4],
  },
});
