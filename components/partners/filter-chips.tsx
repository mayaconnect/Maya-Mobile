import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

interface Filter {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
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
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  {
    id: 'Café',
    label: 'Café',
    icon: 'cafe',
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  {
    id: 'Shop',
    label: 'Sh',
    icon: 'bag',
    color: Colors.secondary[600],
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
];

export function FilterChips({ selectedFilter, onFilterChange, style }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
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
              { backgroundColor: isSelected ? filter.backgroundColor : 'transparent' }
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
                  fontWeight: isSelected ? '600' : '400',
                }
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  } as ViewStyle,
  container: {
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
    borderWidth: 1,
    borderColor: 'transparent',
    gap: Spacing.xs,
  } as ViewStyle,
  chipSelected: {
    borderColor: 'transparent',
  } as ViewStyle,
  chipUnselected: {
    borderColor: Colors.primary[200],
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  chipText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  } as TextStyle,
});