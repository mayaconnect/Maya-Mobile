import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerKPICardProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  value: string;
  label: string;
  comparison?: string;
  comparisonColor?: string;
  onPress?: () => void;
}

const PartnerKPICard: React.FC<PartnerKPICardProps> = ({
  icon,
  iconColor,
  iconBgColor,
  value,
  label,
  comparison,
  comparisonColor = '#10B981',
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {comparison && (
          <Text style={[styles.comparison, { color: comparisonColor }]}>
            {comparison}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface PartnerKPICardsProps {
  monthRevenue: number;
  monthRevenueChange?: number;
  todayScans: number;
  todayScansChange?: number;
  uniqueClients: number;
  newClients?: number;
  onRevenuePress?: () => void;
  onScansPress?: () => void;
  onClientsPress?: () => void;
}

export const PartnerKPICards: React.FC<PartnerKPICardsProps> = ({
  monthRevenue = 0,
  monthRevenueChange,
  todayScans = 0,
  todayScansChange,
  uniqueClients = 0,
  newClients = 0,
  onRevenuePress,
  onScansPress,
  onClientsPress,
}) => {
  const formatRevenueChange = (change?: number) => {
    if (change === undefined || change === null) return undefined;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change}% vs mois dernier`;
  };

  const formatScansChange = (change?: number) => {
    if (change === undefined || change === null) return undefined;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change} depuis hier`;
  };

  return (
    <View style={styles.container}>
      <PartnerKPICard
        icon="cash"
        iconColor="#10B981"
        iconBgColor="rgba(16, 185, 129, 0.2)"
        value={`${monthRevenue.toFixed(2).replace('.', ',')} €`}
        label="Revenus du mois"
        comparison={formatRevenueChange(monthRevenueChange)}
        comparisonColor="#10B981"
        onPress={onRevenuePress}
      />

      <PartnerKPICard
        icon="qr-code"
        iconColor="#3B82F6"
        iconBgColor="rgba(59, 130, 246, 0.2)"
        value={todayScans.toString()}
        label="Scans aujourd'hui"
        comparison={formatScansChange(todayScansChange)}
        comparisonColor="#10B981"
        onPress={onScansPress}
      />

      <PartnerKPICard
        icon="people"
        iconColor="#8B5CF6"
        iconBgColor="rgba(139, 92, 246, 0.2)"
        value={uniqueClients.toString()}
        label="Clients uniques"
        comparison={newClients > 0 ? `+${newClients} nouveaux` : undefined}
        comparisonColor="#10B981"
        onPress={onClientsPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: Spacing.md,
  } as ViewStyle,
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  value: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: 2,
    letterSpacing: -0.5,
  } as TextStyle,
  label: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 2,
  } as TextStyle,
  comparison: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    marginTop: 2,
  } as TextStyle,
});

