import { Colors, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';

interface HistoryHeaderProps {
  loading: boolean;
  transactionsCount: number;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({ loading, transactionsCount }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Historique des visites</Text>
      <Text style={styles.subtitle}>
        {loading ? 'Chargement...' : transactionsCount > 0
          ? `${transactionsCount} visite${transactionsCount > 1 ? 's' : ''}`
          : 'Aucune visite'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -1,
    marginBottom: Spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
});

