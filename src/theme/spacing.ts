/**
 * Maya Connect V2 — Spacing & Layout Tokens
 */

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  orange: {
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  navy: {
    shadowColor: '#1F2A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

/** Alias for shadow — many screens import as `shadows` */
export const shadows = shadow;
export const hitSlop = { top: 12, right: 12, bottom: 12, left: 12 };

/** Common layout dimensions */
export const layout = {
  screenPadding: spacing[5],
  cardPadding: spacing[4],
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightSmall: 40,
  tabBarHeight: 80,
  headerHeight: 56,
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
  avatarSize: {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    '2xl': 100,
  },
} as const;
