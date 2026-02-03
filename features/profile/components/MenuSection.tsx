import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

interface MenuSectionProps {
  items: MenuItem[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({ items }) => {
  return (
    <View style={styles.menuSection}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <Ionicons name={item.icon} size={22} color={Colors.text.primary} />
          <Text style={styles.menuText}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  menuSection: {
        borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.xs,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    overflow: 'hidden',
  } as ViewStyle,
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    marginLeft: Spacing.md,
    fontWeight: '600',
  } as TextStyle,
});

