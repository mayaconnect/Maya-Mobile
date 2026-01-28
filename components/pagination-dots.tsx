import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface PaginationDotsProps {
  totalPages: number;
  currentPage: number;
}

export function PaginationDots({ totalPages, currentPage }: PaginationDotsProps) {

  return (
    <View style={styles.container}>
      {/* Dots améliorés avec animations */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalPages }, (_, index) => (
          <PaginationDot
            key={index}
            isActive={index === currentPage}
            index={index}
            currentPage={currentPage}
          />
        ))}
      </View>
    </View>
  );
}

interface PaginationDotProps {
  isActive: boolean;
  index: number;
  currentPage: number;
}

function PaginationDot({ isActive, index, currentPage }: PaginationDotProps) {
  const scale = useSharedValue(isActive ? 1.2 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.5);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.2 : 1, {
      damping: 10,
      stiffness: 200,
    });
    opacity.value = withTiming(isActive ? 1 : 0.5, { duration: 300 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dotContainer, animatedStyle]}>
      {isActive ? (
        <View style={styles.activeDot} />
      ) : (
        <View style={styles.inactiveDot} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B2F3F',
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
});
