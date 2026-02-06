import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerDailyActivityProps {
  transactions: any[];
}

export const PartnerDailyActivity: React.FC<PartnerDailyActivityProps> = ({
  transactions = [],
}) => {
  // Calculer l'activité par heure (9h à 15h)
  const hourlyActivity = useMemo(() => {
    const activity: { [key: number]: number } = {};
    
    // Initialiser toutes les heures à 0
    for (let hour = 9; hour <= 15; hour++) {
      activity[hour] = 0;
    }

    // Compter les transactions par heure
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt || transaction.date || transaction.transactionDate);
      const hour = date.getHours();
      
      if (hour >= 9 && hour <= 15) {
        activity[hour] = (activity[hour] || 0) + 1;
      }
    });

    return activity;
  }, [transactions]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activité du jour</Text>
        <TouchableOpacity
          style={styles.viewWeekButton}
          onPress={() => {
            // TODO: Naviguer vers la vue semaine
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={16} color={Colors.text.light} />
          <Text style={styles.viewWeekText}>Voir semaine</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.timeline}>
          {[9, 10, 11, 12, 13, 14, 15].map((hour) => (
            <View key={hour} style={styles.hourItem}>
              <Text style={styles.hourLabel}>{hour}h</Text>
              <Text style={styles.hourValue}>{hourlyActivity[hour] || 0}</Text>
            </View>
          ))}
        </View>
        {/* Ligne de connexion */}
        <View style={styles.connectionLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    position: 'relative',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  viewWeekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  viewWeekText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  timelineContainer: {
    position: 'relative',
    paddingBottom: Spacing.md,
  } as ViewStyle,
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  hourItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  hourLabel: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  } as TextStyle,
  hourValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '900',
    color: Colors.text.light,
    minHeight: 24,
  } as TextStyle,
  connectionLine: {
    position: 'absolute',
    bottom: 32,
    left: Spacing.sm,
    right: Spacing.sm,
    height: 2,
    backgroundColor: '#8B2F3F',
    borderRadius: 1,
  } as ViewStyle,
});

