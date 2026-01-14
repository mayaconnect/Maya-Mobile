import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface Filter {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  count?: number;
}

interface FilterChipsProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  style?: any;
}

const filters: Filter[] = [
  {
    id: 'Tous',
    label: 'Tous',
    icon: 'star',
    color: Colors.text.light,
    backgroundColor: Colors.secondary[600],
  },
  {
    id: 'Restaurant',
    label: 'Restaurant',
    icon: 'restaurant',
    color: Colors.accent.orange,
    backgroundColor: Colors.accent.orange + '20',
  },
  {
    id: 'Café',
    label: 'Café',
    icon: 'cafe',
    color: '#fbbf24',
    backgroundColor: '#fbbf2420',
  },
  {
    id: 'Shop',
    label: 'Shopping',
    icon: 'bag',
    color: Colors.secondary[600],
    backgroundColor: Colors.secondary[600] + '20',
  },
  {
    id: 'Promotions',
    label: 'Promos',
    icon: 'gift',
    color: Colors.status.success,
    backgroundColor: Colors.status.success + '20',
  },
];

export function FilterChips({ selectedFilter, onFilterChange, style }: FilterChipsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter.id;
          
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                { 
                  backgroundColor: isSelected ? filter.backgroundColor : Colors.background.light,
                  borderColor: isSelected ? filter.color : Colors.primary[200],
                }
              ]}
              onPress={() => onFilterChange(filter.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={isSelected ? filter.color : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? filter.color : Colors.text.secondary,
                    fontWeight: isSelected ? '600' : '500',
                  }
                ]}
              >
                {filter.label}
              </Text>
              {filter.count !== undefined && (
                <View style={[
                  styles.countBadge,
                  { backgroundColor: isSelected ? filter.color + '20' : Colors.primary[100] }
                ]}>
                  <Text style={[
                    styles.countText,
                    { color: isSelected ? filter.color : Colors.text.secondary }
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  scrollView: {
    flexGrow: 0,
  } as ViewStyle,
  scrollContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  chipSelected: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  chipUnselected: {
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  chipText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  } as TextStyle,
  countBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  } as ViewStyle,
  countText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  } as TextStyle,
});