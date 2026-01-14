import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilterButton?: boolean;
  style?: any;
}

export function SearchBar({ 
  value, 
  onChangeText, 
  placeholder = "Rechercher un partenaire...",
  onFilterPress,
  showFilterButton = true,
  style 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.primary[200], Colors.primary[500]],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <Animated.View style={[
      styles.container,
      {
        borderColor,
        shadowOpacity,
      },
      style
    ]}>
      <View style={styles.inputContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? Colors.primary[500] : Colors.text.secondary} 
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.secondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity 
            onPress={() => onChangeText('')}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {showFilterButton && (
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={18} color={Colors.text.light} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  searchIcon: {
    marginRight: Spacing.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    paddingVertical: Spacing.xs,
  } as TextStyle,
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  } as ViewStyle,
  filterButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginLeft: Spacing.sm,
  } as ViewStyle,
});
