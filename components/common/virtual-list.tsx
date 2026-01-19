/**
 * Composant VirtualList pour optimiser le rendu des longues listes
 * Utilise FlatList avec windowSize optimisé pour React Native
 */

import React, { useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/design-system';

interface VirtualListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  estimatedItemSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  initialNumToRender?: number;
}

export function VirtualList<T>({
  data,
  renderItem,
  keyExtractor,
  loading = false,
  emptyMessage = 'Aucun élément à afficher',
  estimatedItemSize = 100,
  windowSize = 10, // Nombre d'écrans à rendre en avant/arrière
  maxToRenderPerBatch = 10, // Nombre d'éléments à rendre par batch
  updateCellsBatchingPeriod = 50, // Délai entre les batches (ms)
  initialNumToRender = 10, // Nombre d'éléments à rendre initialement
  ...props
}: VirtualListProps<T>) {
  const getItemLayout = useMemo(() => {
    return (_: any, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    });
  }, [estimatedItemSize]);

  if (loading && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      {...props}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      initialNumToRender={initialNumToRender}
      removeClippedSubviews={true} // Optimisation : retire les vues hors écran
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

