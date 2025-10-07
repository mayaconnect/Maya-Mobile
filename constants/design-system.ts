// Direction Artistique Maya - Système de design cohérent

export const Colors = {
  // Couleurs principales
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Couleurs secondaires (violet)
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Couleurs d'accent
  accent: {
    gold: '#fbbf24',
    emerald: '#10b981',
    rose: '#f43f5e',
    cyan: '#06b6d4',
    orange: '#f97316',
  },
  
  // Gradients cohérents basés sur la palette principale
  gradients: {
    primary: ['#667eea', '#764ba2'], // Bleu-violet principal
    secondary: ['#667eea', '#8b5cf6'], // Variation violette
    success: ['#4facfe', '#667eea'], // Bleu-cyan vers bleu principal
    warning: ['#f093fb', '#667eea'], // Rose vers bleu principal
    info: ['#a8edea', '#667eea'], // Turquoise vers bleu principal
    dark: ['#2c3e50', '#667eea'], // Sombre vers bleu principal
  },
  
  // Couleurs de fond
  background: {
    light: '#ffffff',
    dark: '#1a1a1a',
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Couleurs de texte
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    light: '#ffffff',
    muted: '#9ca3af',
  },
  
  // Couleurs d'état
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
};

export const Typography = {
  // Tailles de police
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Poids de police
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Espacement des lettres
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
};
