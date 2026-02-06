import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface PartnerRecentActivityProps {
  transactions: any[];
  scans: any[];
}

export const PartnerRecentActivity: React.FC<PartnerRecentActivityProps> = ({
  transactions = [],
  scans = [],
}) => {
  const activities = useMemo(() => {
    const activitiesList: Array<{
      id: string;
      title: string;
      subtitle: string;
      value?: string;
      valueColor?: string;
      icon?: string;
    }> = [];

    // Récupérer les scans récents
    const recentScans = scans.slice(0, 3);
    recentScans.forEach((scan) => {
      const customer = scan.customer || scan.client || {};
      const customerName = customer.firstName && customer.lastName
        ? `${customer.firstName} ${customer.lastName.charAt(0)}.`
        : customer.name || 'Client';
      const date = new Date(scan.createdAt || scan.date || scan.scanDate);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      let subtitle = '';
      if (diffMinutes < 60) {
        subtitle = `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        subtitle = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays === 1) {
        subtitle = `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        subtitle = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }

      const amount = scan.amountGross || scan.amount || 0;
      activitiesList.push({
        id: scan.id || scan.transactionId || `scan-${activitiesList.length}`,
        title: `Nouveau scan - ${customerName}`,
        subtitle,
        value: amount > 0 ? `+${amount.toFixed(2)}€` : undefined,
        valueColor: '#10B981',
      });
    });

    // Récupérer les transactions récentes avec offres
    const recentTransactions = transactions
      .filter((t) => t.discountAmount > 0 || t.promotion)
      .slice(0, 2);
    
    recentTransactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt || transaction.date || transaction.transactionDate);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let subtitle = '';
      if (diffHours < 24) {
        subtitle = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays === 1) {
        subtitle = `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        subtitle = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }

      const promotionName = transaction.promotion?.name || transaction.promotionName || 'Offre';
      const usageCount = transaction.promotionUsageCount || 0;
      
      activitiesList.push({
        id: transaction.id || transaction.transactionId || `transaction-${activitiesList.length}`,
        title: `Offre "${promotionName}" utilisée`,
        subtitle,
        value: usageCount > 0 ? `${usageCount}ème utilisation` : undefined,
      });
    });

    // Récupérer les avis récents (si disponibles)
    // Pour l'instant, on simule avec les transactions qui ont un rating
    const reviews = transactions
      .filter((t) => t.rating || t.reviewRating)
      .slice(0, 1);
    
    reviews.forEach((review) => {
      const date = new Date(review.createdAt || review.date || review.reviewDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const rating = review.rating || review.reviewRating || 5;

      let subtitle = '';
      if (diffDays === 0) {
        subtitle = `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        subtitle = `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        subtitle = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }

      activitiesList.push({
        id: review.id || `review-${activitiesList.length}`,
        title: `Nouvel avis ${rating} étoile${rating > 1 ? 's' : ''}`,
        subtitle,
        value: '⭐'.repeat(rating),
        valueColor: '#FBBF24',
      });
    });

    return activitiesList.slice(0, 5).sort((a, b) => {
      // Trier par date (les plus récents en premier)
      return 0; // Pour l'instant, on garde l'ordre
    });
  }, [transactions, scans]);

  if (activities.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Activité récente</Text>
      
      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityItem}>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
          </View>
          {activity.value && (
            <View style={[styles.activityValue, activity.valueColor && { backgroundColor: activity.valueColor }]}>
              <Text style={styles.activityValueText}>{activity.value}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  } as TextStyle,
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  activityContent: {
    flex: 1,
    marginRight: Spacing.md,
  } as ViewStyle,
  activityTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  activitySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  activityValue: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: '#10B981',
  } as ViewStyle,
  activityValueText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  } as TextStyle,
});

