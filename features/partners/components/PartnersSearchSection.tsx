import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';

interface PartnersSearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const PartnersSearchSection: React.FC<PartnersSearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const getIcon = (category: string) => {
    if (category === 'Tous') return 'apps';
    if (category === 'Café') return 'cafe';
    if (category === 'Restaurant') return 'restaurant';
    if (category === 'Shop') return 'storefront';
    return 'business';
  };

  return (
    <View style={styles.searchSection}>
      <LinearGradient
        colors={['rgba(139, 47, 63, 0.15)', 'rgba(139, 47, 63, 0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.searchInputContainer}
      >
        <View style={styles.searchIconWrapper}>
          <Ionicons name="search" size={20} color="#8B2F3F" />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un partenaire..."
          placeholderTextColor={Colors.text.secondary}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              onPress={() => onCategoryChange(category)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#8B2F3F', '#6B1F2F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.categoryPill, styles.categoryPillActive]}
                >
                  <Ionicons
                    name={getIcon(category) as any}
                    size={16}
                    color="white"
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.categoryPillTextActive}>{category}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.categoryPill}>
                  <Ionicons
                    name={getIcon(category) as any}
                    size={14}
                    color={Colors.text.secondary}
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.categoryPillText}>{category}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.lg,
  } as ViewStyle,
  searchIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.5)',
    ...Shadows.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base + 1,
    color: Colors.text.light,
    padding: 0,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,
  clearBtn: {
    padding: 4,
    marginLeft: Spacing.xs,
  } as ViewStyle,
  categoriesContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.xs,
  } as ViewStyle,
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 42,
    gap: Spacing.xs + 2,
    ...Shadows.sm,
  } as ViewStyle,
  categoryPillActive: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.lg,
  } as ViewStyle,
  categoryPillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  } as TextStyle,
  categoryPillTextActive: {
    color: 'white',
    fontWeight: '800',
    letterSpacing: 0.3,
  } as TextStyle,
  categoryIcon: {
    marginRight: 4,
  } as TextStyle,
});

