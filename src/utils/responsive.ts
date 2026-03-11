/**
 * Maya Connect V2 — Responsive Utilities
 *
 * Design reference: 375pt (iPhone SE/13 Mini).
 * All pixel values scale proportionally to the actual screen width.
 */
import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

/** Base design width (iPhone 13 / 14 / SE3) */
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/** Scale a value proportionally to screen width */
export const wp = (size: number): number =>
  PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size);

/** Scale a value proportionally to screen height */
export const hp = (size: number): number =>
  PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / BASE_HEIGHT) * size);

/** Percentage of screen width */
export const widthPercent = (percent: number): number =>
  (SCREEN_WIDTH * percent) / 100;

/** Percentage of screen height */
export const heightPercent = (percent: number): number =>
  (SCREEN_HEIGHT * percent) / 100;

/** Moderate scaling (50% of full scale) — good for fonts */
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (wp(size) - size) * factor;

/** Is device a small screen (e.g. iPhone SE, old Androids) */
export const isSmallDevice = SCREEN_WIDTH < 375;

/** Is device a large screen (e.g. iPhone Pro Max, large Androids) */
export const isLargeDevice = SCREEN_WIDTH >= 414;

/** Is device a tablet */
export const isTablet = SCREEN_WIDTH >= 768;

/** Platform helpers */
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/** Current dimensions (static snapshot) */
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} as const;

/** Safe font size that scales moderately */
export const fontSize = (size: number): number => moderateScale(size, 0.3);

/** Responsive icon size */
export const iconSize = (size: number): number => wp(size);
