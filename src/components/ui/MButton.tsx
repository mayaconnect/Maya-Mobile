/**
 * Maya Connect V2 — MButton
 *
 * Primary call-to-action button with gradient, outline, and ghost variants.
 * Supports loading state, icons, and full-width layout.
 */
import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, gradients } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { wp } from '../../utils/responsive';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface MButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
}

const SIZES: Record<ButtonSize, { height: number; paddingH: number; text: TextStyle }> = {
  sm: { height: wp(36), paddingH: spacing[4], text: { ...textStyles.caption, fontWeight: '600' } },
  md: { height: wp(48), paddingH: spacing[6], text: textStyles.button },
  lg: { height: wp(56), paddingH: spacing[8], text: { ...textStyles.button, fontSize: wp(17) } },
};

export const MButton: React.FC<MButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const sizeConfig = SIZES[size];
  const isDisabled = disabled || loading;

  const content = (
    <View style={[styles.inner, { height: sizeConfig.height, paddingHorizontal: sizeConfig.paddingH }]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.orange[500] : '#FFF'}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Animated.Text
            style={[
              sizeConfig.text,
              variantTextColor[variant],
              isDisabled && styles.disabledText,
            ]}
          >
            {title}
          </Animated.Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </View>
  );

  if (variant === 'primary' || variant === 'secondary') {
    const grad = variant === 'primary' ? [...gradients.primary] : [...gradients.accent];
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        disabled={isDisabled}
        style={[animStyle, fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={grad as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            { height: sizeConfig.height, borderRadius: borderRadius.xl },
            isDisabled && styles.disabledBg,
          ]}
        >
          {content}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[
        animStyle,
        styles.base,
        { height: sizeConfig.height, borderRadius: borderRadius.xl },
        variantStyle[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabledBg,
        style,
      ]}
    >
      {content}
    </AnimatedTouchable>
  );
};

const variantStyle: Record<string, ViewStyle> = {
  outline: {
    borderWidth: 1.5,
    borderColor: colors.orange[500],
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error[500],
  },
};

const variantTextColor: Record<string, TextStyle> = {
  primary: { color: '#FFFFFF' },
  secondary: { color: '#FFFFFF' },
  outline: { color: colors.orange[500] },
  ghost: { color: colors.orange[500] },
  danger: { color: '#FFFFFF' },
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  iconLeft: { marginRight: spacing[2] },
  iconRight: { marginLeft: spacing[2] },
  disabledBg: { opacity: 0.5 },
  disabledText: { opacity: 0.7 },
});
