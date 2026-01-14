import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { SavingsByCategoryResponse, TransactionsService } from '@/services/transactions.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface SavingsByCategoryProps {
  userId: string;
}

export function SavingsByCategory({ userId }: SavingsByCategoryProps) {
  const [savings, setSavings] = useState<SavingsByCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavingsByCategory = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 [SavingsByCategory] Chargement des économies par catégorie pour l\'utilisateur:', userId);

      const response = await TransactionsService.getUserSavingsByCategory(userId);

      console.log('✅ [SavingsByCategory] Économies reçues:', {
        count: response.length,
        categories: response.map(s => s.category),
      });

      setSavings(response);
    } catch (err) {
      console.error('❌ [SavingsByCategory] Erreur lors du chargement des économies:', err);
      let errorMessage = 'Impossible de charger vos économies par catégorie';

      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Accès refusé.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setSavings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSavingsByCategory();
  }, [loadSavingsByCategory]);

  // Calculer le total des économies
  const totalSavings = savings.reduce((sum, s) => sum + (s.totalSavings || 0), 0);

  // Obtenir une icône pour chaque catégorie
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('restaurant') || categoryLower.includes('food')) {
      return 'restaurant';
    }
    if (categoryLower.includes('shopping') || categoryLower.includes('mode') || categoryLower.includes('vêtement')) {
      return 'shirt';
    }
    if (categoryLower.includes('santé') || categoryLower.includes('health') || categoryLower.includes('pharmacie')) {
      return 'medical';
    }
    if (categoryLower.includes('loisirs') || categoryLower.includes('entertainment') || categoryLower.includes('divertissement')) {
      return 'game-controller';
    }
    if (categoryLower.includes('beauté') || categoryLower.includes('beauty') || categoryLower.includes('cosmétique')) {
      return 'sparkles';
    }
    if (categoryLower.includes('sport') || categoryLower.includes('fitness')) {
      return 'fitness';
    }
    if (categoryLower.includes('voyage') || categoryLower.includes('travel') || categoryLower.includes('hôtel')) {
      return 'airplane';
    }
    if (categoryLower.includes('éducation') || categoryLower.includes('education') || categoryLower.includes('formation')) {
      return 'school';
    }

    return 'pricetag';
  };

  // Obtenir une couleur pour chaque catégorie
  const getCategoryColor = (index: number): string => {
    const colors = [
      '#8B2F3F', // Rouge principal
      Colors.accent.orange,
      Colors.accent.gold,
      '#10B981', // Vert
      '#3B82F6', // Bleu
      '#8B5CF6', // Violet
      '#EC4899', // Rose
      '#F59E0B', // Orange foncé
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Économies par catégorie</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text.light} />
          <Text style={styles.loadingText}>Chargement des économies...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Économies par catégorie</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={Colors.status.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (savings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Économies par catégorie</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetags-outline" size={48} color={Colors.text.secondary} />
          <Text style={styles.emptyText}>Aucune économie pour le moment</Text>
          <Text style={styles.emptySubtext}>Commencez à utiliser votre QR Code chez nos partenaires</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Économies par catégorie</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totalSavings.toFixed(2)} €</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.categoriesContainer}
        showsVerticalScrollIndicator={false}
      >
        {savings.map((saving, index) => {
          const savingsAmount = saving.totalSavings || 0;
          const percentage = totalSavings > 0 ? (savingsAmount / totalSavings) * 100 : 0;
          const categoryColor = getCategoryColor(index);
          const categoryIcon = getCategoryIcon(saving.category || 'Autre');

          return (
            <View key={`${saving.category}-${index}`} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconContainer, { backgroundColor: `${categoryColor}20` }]}>
                  <Ionicons name={categoryIcon as any} size={24} color={categoryColor} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{saving.category || 'Autre'}</Text>
                  {(saving.transactionCount || 0) > 0 && (
                    <Text style={styles.categoryTransactions}>
                      {saving.transactionCount} {saving.transactionCount > 1 ? 'transactions' : 'transaction'}
                    </Text>
                  )}
                </View>
                <View style={styles.categoryAmountContainer}>
                  <Text style={[styles.categoryAmount, { color: categoryColor }]}>
                    {savingsAmount.toFixed(2)} €
                  </Text>
                  <Text style={styles.categoryPercentage}>{percentage.toFixed(0)}%</Text>
                </View>
              </View>

              {/* Barre de progression */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${percentage}%`,
                      backgroundColor: categoryColor,
                    }
                  ]}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.cardDark,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
  } as TextStyle,
  totalBadge: {
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
  } as ViewStyle,
  totalLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 2,
  } as TextStyle,
  totalValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: '#8B2F3F',
    textAlign: 'center',
  } as TextStyle,
  scrollView: {
    maxHeight: 400,
  } as ViewStyle,
  categoriesContainer: {
    gap: Spacing.md,
  } as ViewStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  } as ViewStyle,
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.status.error,
    textAlign: 'center',
  } as TextStyle,
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  } as ViewStyle,
  emptyText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
    marginTop: Spacing.md,
  } as TextStyle,
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  } as TextStyle,
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  categoryInfo: {
    flex: 1,
  } as ViewStyle,
  categoryName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  categoryTransactions: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  categoryAmountContainer: {
    alignItems: 'flex-end',
  } as ViewStyle,
  categoryAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    marginBottom: 2,
  } as TextStyle,
  categoryPercentage: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  } as ViewStyle,
});
