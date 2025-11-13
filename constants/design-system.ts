export const Colors = {
  primary: {
    50: '#f2f5ff',
    100: '#dfe5ff',
    200: '#bcc7ff',
    300: '#8e9fff',
    400: '#6178ff',
    500: '#3C4BFF',
    600: '#2e38d6',
    700: '#242cb0',
    800: '#1a2086',
    900: '#12175f',
  },
  secondary: {
    50: '#edfff8',
    100: '#caffee',
    200: '#9bffde',
    300: '#68ffd0',
    400: '#3fffc1',
    500: '#27EFA1',
    600: '#1ec180',
    700: '#159663',
    800: '#0d6b46',
    900: '#06412a',
  },
  accent: {
    gold: '#F6C756',
    emerald: '#27efa1',
    rose: '#FF6B6B',
    cyan: '#2DD9FF',
    orange: '#FF9F68',
  },
  gradients: {
    primary: ['#15162E', '#242E5F', '#3C4BFF'] as const,
    crimson: ['#4D1328', '#7B1E3D', '#A32552'] as const,
    violet: ['#15162E', '#242E5F', '#3C4BFF'] as const,
    success: ['#0C2F2B', '#146149', '#27EFA1'] as const,
    warning: ['#34170E', '#602319', '#FF6B6B'] as const,
    midnight: ['#050506', '#0A0A13', '#121325'] as const,
    aurora: ['#121325', '#18203F', '#26346A'] as const,
  },
  background: {
    light: '#050506',
    dark: '#050506',
    surface: '#0C0C14',
    card: '#10101A',
    overlay: 'rgba(18,19,37,0.72)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.70)',
    light: '#FFFFFF',
    muted: 'rgba(255,255,255,0.45)',
  },
  status: {
    success: '#27EFA1',
    error: '#FF6B6B',
    warning: '#FF9F68',
    info: '#3C4BFF',
  },
} as const;

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 30,
    '3xl': 38,
    '4xl': 48,
    '5xl': 60,
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  letterSpacing: {
    tight: -0.6,
    normal: 0,
    wide: 0.4,
    wider: 0.75,
  },
} as const;

export const Spacing = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 44,
  '3xl': 60,
  '4xl': 84,
};

export const BorderRadius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  '2xl': 36,
  '3xl': 44,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 16,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.3,
    shadowRadius: 46,
    elevation: 26,
  },
};
