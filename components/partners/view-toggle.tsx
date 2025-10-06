import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface ViewToggleProps {
  selectedMode: 'liste' | 'carte';
  onModeChange: (mode: 'liste' | 'carte') => void;
  style?: any;
}

export function ViewToggle({ selectedMode, onModeChange, style }: ViewToggleProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          selectedMode === 'liste' ? styles.buttonSelected : styles.buttonUnselected
        ]}
        onPress={() => onModeChange('liste')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.buttonText,
            selectedMode === 'liste' ? styles.buttonTextSelected : styles.buttonTextUnselected
          ]}
        >
          Liste
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          selectedMode === 'carte' ? styles.buttonSelected : styles.buttonUnselected
        ]}
        onPress={() => onModeChange('carte')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="map"
          size={16}
          color={selectedMode === 'carte' ? Colors.text.light : Colors.text.secondary}
          style={styles.buttonIcon}
        />
        <Text
          style={[
            styles.buttonText,
            selectedMode === 'carte' ? styles.buttonTextSelected : styles.buttonTextUnselected
          ]}
        >
          Carte
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  } as ViewStyle,
  buttonSelected: {
    backgroundColor: Colors.primary[600],
  } as ViewStyle,
  buttonUnselected: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  buttonIcon: {
    marginRight: Spacing.xs,
  } as ViewStyle,
  buttonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
  } as TextStyle,
  buttonTextSelected: {
    color: Colors.text.light,
  } as TextStyle,
  buttonTextUnselected: {
    color: Colors.text.secondary,
  } as TextStyle,
});