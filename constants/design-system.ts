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
    primary: ['#1A0A0E', '#2D0F15', '#4A0E1F', '#6B1F2F', '#8B2F3F'] as const,
    dark: ['#1A0A0E', '#2D0F15', '#3A0F1A'] as const,
    card: ['#2D1B1F', '#3D2B2F', '#4D3B3F'] as const,
    blue: ['#1E3A8A', '#3B82F6', '#60A5FA'] as const,
    success: ['#10B981', '#27EFA1', '#34D399'] as const,
    warning: ['#EF4444', '#FF6B6B', '#F87171'] as const,
    info: ['#3C4BFF', '#6366F1', '#818CF8'] as const,
  },
  background: {
    light: '#1A0A0E',
    dark: '#1A0A0E',
    surface: '#2D1B1F',
    card: '#F5F5F5', // Gris clair pour les cartes de login
    cardDark: '#2D1B1F', // Sombre pour les cartes dans l'app
    overlay: 'rgba(0,0,0,0.7)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.7)',
    light: '#FFFFFF',
    muted: 'rgba(255,255,255,0.5)',
    dark: '#0F172A', // Pour le texte sur fond clair
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  lg: {
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  xl: {
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 36,
    elevation: 24,
  },
};
