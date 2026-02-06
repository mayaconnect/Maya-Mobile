import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface RecentActivityItem {
  id: string;
  title: string;
  subtitle: string;
  amount?: string;
  amountColor?: string;
  type: 'transaction' | 'scan' | 'subscription';
}

interface ProfileRecentActivityProps {
  activities: RecentActivityItem[];
}

export const ProfileRecentActivity: React.FC<ProfileRecentActivityProps> = ({
  activities = [],
}) => {
  if (activities.length === 0) {
    return null;
  }

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${diffDays} jours, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Activité récente</Text>
      
      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityItem}>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
          </View>
          {activity.amount && (
            <Text style={[styles.activityAmount, { color: activity.amountColor || Colors.text.light }]}>
              {activity.amount}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.sm,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  } as TextStyle,
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  activityContent: {
    flex: 1,
  } as ViewStyle,
  activityTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  activitySubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  } as TextStyle,
  activityAmount: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginLeft: Spacing.md,
  } as TextStyle,
});

