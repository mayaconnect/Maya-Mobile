import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface FeatureIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export function FeatureIcon({ 
  name, 
  size = 80, 
  color = '#FFD700', 
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  animated = true
}: FeatureIconProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      // Animation simple et subtile
      scale.value = withTiming(1, { duration: 800 });
      rotation.value = withTiming(0, { duration: 800 });
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        <View style={[styles.backgroundCircle, { backgroundColor }]}>
          <Ionicons name={name} size={size} color={color} />
        </View>
        <View style={styles.glowEffect} />
        <View style={styles.outerRing} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  glowEffect: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -10,
    left: -10,
  },
  outerRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    top: -20,
    left: -20,
  },
});
