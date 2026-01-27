import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface PaginationDotsProps {
  totalPages: number;
  currentPage: number;
}

export function PaginationDots({ totalPages, currentPage }: PaginationDotsProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(currentPage / (totalPages - 1), {
      damping: 15,
      stiffness: 100,
    });
  }, [currentPage, totalPages]);

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${((currentPage + 1) / totalPages) * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Barre de progression moderne */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, progressBarStyle]}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.progressBarGlow} />
          </Animated.View>
        </View>
      </View>

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
  const scale = useSharedValue(isActive ? 1.3 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.4);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.3 : 1, {
      damping: 10,
      stiffness: 200,
    });
    opacity.value = withTiming(isActive ? 1 : 0.4, { duration: 300 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dotContainer, animatedStyle]}>
      {isActive ? (
        <LinearGradient
          colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeDot}
        >
          <View style={styles.activeDotInner} />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveDot} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  progressBarContainer: {
    width: 120,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    bottom: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(139, 47, 63, 0.8)',
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
