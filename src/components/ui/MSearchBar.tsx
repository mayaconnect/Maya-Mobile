/**
 * Maya Connect V2 — MSearchBar
 *
 * Polished search bar with subtle shadow, soft focus glow,
 * animated clear button, and optional filter action.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

interface MSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onFilterPress?: () => void;
  style?: ViewStyle;
  autoFocus?: boolean;
}

const BAR_HEIGHT = wp(48);

export const MSearchBar: React.FC<MSearchBarProps> = ({
  placeholder = 'Rechercher…',
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  style,
  autoFocus = false,
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
  };

  const handleBlur = () => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
  };

  const containerAnimStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.neutral[150] ?? colors.neutral[200], colors.orange[400]],
    ),
  }));

  const iconColor = focused ? colors.orange[500] : colors.neutral[400];

  return (
    <Animated.View
      style={[
        styles.container,
        containerAnimStyle,
        focused && styles.containerFocused,
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => inputRef.current?.focus()}
        style={styles.searchIcon}
      >
        <Ionicons name="search-outline" size={wp(20)} color={iconColor} />
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[350] ?? colors.neutral[400]}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        selectionColor={colors.orange[400]}
        style={styles.input}
      />

      {value.length > 0 && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              inputRef.current?.focus();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.clearBtn}
          >
            <View style={styles.clearCircle}>
              <Ionicons name="close" size={wp(12)} color="#FFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {onFilterPress && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={onFilterPress}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={styles.filterBtn}
          >
            <Ionicons
              name="options-outline"
              size={wp(20)}
              color={colors.neutral[500]}
            />
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[3],
    height: BAR_HEIGHT,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    // Subtle resting shadow
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        }
      : {}),
  },
  containerFocused: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: colors.orange[500],
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 2,
        }
      : {}),
  },
  searchIcon: {
    marginRight: spacing[2],
    padding: spacing[1],
  },
  input: {
    flex: 1,
    fontFamily: fontFamily?.regular,
    fontSize: fontSize.base,
    color: colors.neutral[900],
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  clearBtn: {
    padding: spacing[1],
  },
  clearCircle: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: wp(20),
    backgroundColor: colors.neutral[200],
    marginHorizontal: spacing[2],
  },
  filterBtn: {
    padding: spacing[1],
  },
});
