/**
 * Maya Connect V2 — MInput
 *
 * Modern text input with smooth floating label, focus glow,
 * error/success states, icon support, and password toggle.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { textStyles, fontFamily, fontSize } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

interface MInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
  success?: boolean;
}

const LABEL_DURATION = 180;
const INPUT_HEIGHT = wp(58);
const LABEL_TOP_ACTIVE = Platform.OS === 'web' ? 8 : wp(8);
const LABEL_TOP_INACTIVE = Platform.OS === 'web' ? 18 : wp(18);

export const MInput: React.FC<MInputProps> = ({
  label,
  error,
  hint,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required,
  success,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}) => {
  const [isFocused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isActive = isFocused || !!value;
  const focusAnim = useSharedValue(value ? 1 : 0);
  const shakeAnim = useSharedValue(0);

  // Animate label when value changes externally
  useEffect(() => {
    if (value && focusAnim.value === 0) {
      focusAnim.value = withTiming(1, { duration: LABEL_DURATION });
    }
  }, [value, focusAnim]);

  // Shake on error
  useEffect(() => {
    if (error) {
      shakeAnim.value = withSpring(1, { damping: 4, stiffness: 400, mass: 0.3 }, () => {
        shakeAnim.value = withTiming(0, { duration: 200 });
      });
    }
  }, [error, shakeAnim]);

  const handleFocus = useCallback(
    (e: any) => {
      setFocused(true);
      focusAnim.value = withTiming(1, {
        duration: LABEL_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      onFocus?.(e);
    },
    [onFocus, focusAnim],
  );

  const handleBlur = useCallback(
    (e: any) => {
      setFocused(false);
      if (!value) {
        focusAnim.value = withTiming(0, {
          duration: LABEL_DURATION,
          easing: Easing.in(Easing.cubic),
        });
      }
      onBlur?.(e);
    },
    [onBlur, value, focusAnim],
  );

  /* ---- Animated styles ---- */
  const labelStyle = useAnimatedStyle(() => {
    const topValue = interpolate(
      focusAnim.value,
      [0, 1],
      [LABEL_TOP_INACTIVE, LABEL_TOP_ACTIVE],
    );
    const fontSizeValue = interpolate(
      focusAnim.value,
      [0, 1],
      [fontSize.base, fontSize.xs],
    );

    return {
      top: topValue,
      fontSize: fontSizeValue,
      color: interpolateColor(
        focusAnim.value,
        [0, 1],
        [
          colors.neutral[400],
          error ? colors.error[500] : isFocused ? colors.orange[500] : colors.neutral[500],
        ],
      ),
    };
  });

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shakeAnim.value,
          [0, 0.25, 0.5, 0.75, 1],
          [0, -8, 8, -4, 0],
        ),
      },
    ],
  }));

  /* ---- Derive colors ---- */
  const borderColor = error
    ? colors.error[500]
    : success
      ? colors.success[500]
      : isFocused
        ? colors.orange[500]
        : colors.neutral[200];

  const bgColor = !editable
    ? colors.neutral[100]
    : isFocused
      ? '#FFFFFF'
      : colors.neutral[50];

  const iconColor = error
    ? colors.error[500]
    : isFocused
      ? colors.orange[500]
      : colors.neutral[400];

  const statusIcon = error
    ? 'alert-circle'
    : success
      ? 'checkmark-circle'
      : null;

  const statusColor = error ? colors.error[500] : colors.success[500];

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Animated.View style={containerAnimStyle}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => editable && inputRef.current?.focus()}
          style={[
            styles.container,
            {
              borderColor,
              backgroundColor: bgColor,
            },
            isFocused && styles.containerFocused,
          ]}
        >
          {/* Left icon */}
          {icon && (
            <View style={styles.iconLeft}>
              <Ionicons name={icon} size={wp(20)} color={iconColor} />
            </View>
          )}

          {/* Input area */}
          <View style={styles.inputArea}>
            <Animated.Text
              style={[
                styles.label,
                { left: icon ? 0 : 0 },
                labelStyle,
              ]}
              numberOfLines={1}
            >
              {label}
              {required && (
                <Animated.Text style={{ color: colors.error[500] }}> *</Animated.Text>
              )}
            </Animated.Text>

            <TextInput
              ref={inputRef}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={editable}
              secureTextEntry={secureTextEntry && !showPassword}
              placeholderTextColor="transparent"
              selectionColor={colors.orange[400]}
              style={[
                styles.input,
                isActive && styles.inputActive,
              ]}
              {...rest}
            />
          </View>

          {/* Right side: status icon / password toggle / custom right icon */}
          <View style={styles.rightArea}>
            {statusIcon && !secureTextEntry && (
              <Ionicons name={statusIcon} size={wp(18)} color={statusColor} />
            )}

            {secureTextEntry && (
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.toggleBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={wp(20)}
                  color={colors.neutral[400]}
                />
              </TouchableOpacity>
            )}

            {rightIcon && !secureTextEntry && (
              <TouchableOpacity
                onPress={onRightIconPress}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name={rightIcon} size={wp(20)} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Error / Hint text */}
      {(error || hint) && (
        <View style={styles.bottomRow}>
          {error ? (
            <>
              <Ionicons
                name="alert-circle-outline"
                size={wp(13)}
                color={colors.error[500]}
                style={styles.bottomIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </>
          ) : hint ? (
            <Text style={styles.hintText}>{hint}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[4],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    height: INPUT_HEIGHT,
    paddingHorizontal: spacing[4],
    // Subtle depth
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }
      : {}),
  },
  containerFocused: {
    borderWidth: 2,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: colors.orange[500],
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 3,
        }
      : {}),
  },
  iconLeft: {
    marginRight: spacing[3],
    width: wp(24),
    alignItems: 'center',
  },
  inputArea: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: fontFamily?.medium,
    color: colors.neutral[400],
  },
  input: {
    flex: 1,
    fontFamily: fontFamily?.regular,
    fontSize: fontSize.base,
    color: colors.neutral[900],
    paddingTop: wp(12),
    paddingBottom: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  inputActive: {
    paddingTop: wp(16),
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[2],
    gap: spacing[2],
  },
  toggleBtn: {
    padding: spacing[1],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1] + 2,
    marginLeft: spacing[1],
    minHeight: wp(16),
  },
  bottomIcon: {
    marginRight: 4,
  },
  errorText: {
    fontFamily: fontFamily?.medium,
    fontSize: fontSize.xs,
    color: colors.error[500],
    flex: 1,
  },
  hintText: {
    fontFamily: fontFamily?.regular,
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    flex: 1,
  },
});
