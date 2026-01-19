/**
 * Composant Image optimisé avec lazy loading et cache
 */

import React, { useState, useCallback } from 'react';
import { Image, ImageProps, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/design-system';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: Error) => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  source,
  placeholder,
  fallback,
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const handleError = useCallback((e: { nativeEvent: { error: Error } }) => {
    setLoading(false);
    setError(true);
    onError?.(e.nativeEvent.error);
  }, [onError]);

  if (error && fallback) {
    return <View style={[styles.container, style]}>{fallback}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        {...props}
        source={source}
        style={[StyleSheet.absoluteFill, style]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode="cover"
      />
      {loading && (
        <View style={styles.placeholder}>
          {placeholder || <ActivityIndicator color={Colors.primary[500]} />}
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  if (typeof prevProps.source === 'object' && typeof nextProps.source === 'object') {
    return prevProps.source.uri === nextProps.source.uri;
  }
  return prevProps.source === nextProps.source;
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.surface,
  },
});

