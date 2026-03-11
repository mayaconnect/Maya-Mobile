/**
 * Maya Connect V2 — Typography System
 * Uses Inter font family loaded via expo-font
 */
import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  ios: {
    light: 'Inter-Light',
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  android: {
    light: 'Inter-Light',
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  default: {
    light: 'System',
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
});

export const fontSize = {
  micro: 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const lineHeight = {
  micro: 14,
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 48,
} as const;

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

/** Pre-composed text styles */
export const textStyles = {
  h1: {
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight['3xl'],
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily?.bold,
  },
  h2: {
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight['2xl'],
    fontWeight: fontWeight.bold,
    fontFamily: fontFamily?.bold,
  },
  h3: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.semiBold,
    fontFamily: fontFamily?.semiBold,
  },
  h4: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.semiBold,
    fontFamily: fontFamily?.semiBold,
  },
  h5: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.semiBold,
    fontFamily: fontFamily?.semiBold,
  },
  subtitle: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.semiBold,
    fontFamily: fontFamily?.semiBold,
  },
  body: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily?.regular,
  },
  bodyMedium: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily?.medium,
  },
  small: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily?.regular,
  },
  smallMedium: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily?.medium,
  },
  xs: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily?.regular,
  },
  micro: {
    fontSize: fontSize.micro,
    lineHeight: lineHeight.micro,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily?.regular,
  },
  button: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
    fontWeight: fontWeight.semiBold,
    fontFamily: fontFamily?.semiBold,
  },
  buttonSmall: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.semiBold,
    fontFamily: fontFamily?.semiBold,
  },
  label: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily?.medium,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily?.regular,
  },
} as const;
