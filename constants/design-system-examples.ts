/**
 * Exemples de palettes de couleurs pour Maya
 * Copiez-collez la palette de votre choix dans design-system.ts
 */

// ============================================
// OPTION 1 : "Modern Wallet Premium" (Recommandé)
// Style : Apple Pay / Google Pay
// ============================================
export const ColorsModernWallet = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Bleu moderne
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Vert succès
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  accent: {
    gold: '#F59E0B',
    emerald: '#10B981',
    rose: '#F43F5E',
    cyan: '#06B6D4',
    orange: '#F97316',
  },
  gradients: {
    primary: ['#3B82F6', '#8B5CF6', '#EC4899'], // Bleu → Violet → Rose
    dark: ['#0F172A', '#1E293B', '#334155'],
    card: ['#FFFFFF', '#F8FAFC', '#F1F5F9'],
    blue: ['#3B82F6', '#60A5FA', '#93C5FD'],
    success: ['#10B981', '#34D399', '#6EE7B7'],
    warning: ['#F59E0B', '#FBBF24', '#FCD34D'],
    info: ['#3B82F6', '#6366F1', '#818CF8'],
  },
  background: {
    light: '#F8FAFC',
    dark: '#0F172A',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardDark: '#1E293B',
    overlay: 'rgba(15, 23, 42, 0.8)',
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    light: '#FFFFFF',
    muted: '#94A3B8',
    dark: '#0F172A',
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
} as const;

// ============================================
// OPTION 2 : "Cashback Premium"
// Style : Rakuten / Honey
// ============================================
export const ColorsCashbackPremium = {
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Rouge premium
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  secondary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6', // Turquoise
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
  accent: {
    gold: '#FFD93D',
    emerald: '#6BCB77',
    rose: '#FF6B6B',
    cyan: '#4ECDC4',
    orange: '#FF9F68',
  },
  gradients: {
    primary: ['#EF4444', '#F87171', '#FCA5A5'],
    dark: ['#1A1A2E', '#16213E', '#0F3460'],
    card: ['#FFFFFF', '#F8F9FA', '#E9ECEF'],
    blue: ['#4ECDC4', '#44A08D'],
    success: ['#6BCB77', '#4ECDC4'],
    warning: ['#FFD93D', '#FF6B6B'],
    info: ['#4ECDC4', '#44A08D'],
  },
  background: {
    light: '#F8F9FA',
    dark: '#1A1A2E',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardDark: '#16213E',
    overlay: 'rgba(26, 26, 46, 0.8)',
  },
  text: {
    primary: '#1A1A2E',
    secondary: '#6C757D',
    light: '#FFFFFF',
    muted: '#ADB5BD',
    dark: '#0F172A',
  },
  status: {
    success: '#6BCB77',
    error: '#EF4444',
    warning: '#FFD93D',
    info: '#4ECDC4',
  },
} as const;

// ============================================
// OPTION 3 : "QR Payment Modern"
// Style : Alipay / WeChat Pay
// ============================================
export const ColorsQRPayment = {
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#00D4AA', // Vert moderne
    600: '#00B894',
    700: '#00A085',
    800: '#008876',
    900: '#006B5F',
  },
  secondary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#0984E3', // Bleu confiance
    600: '#0770CD',
    700: '#055CB7',
    800: '#0448A1',
    900: '#03348B',
  },
  accent: {
    gold: '#FDCB6E',
    emerald: '#00D4AA',
    rose: '#E17055',
    cyan: '#74B9FF',
    orange: '#F39C12',
  },
  gradients: {
    primary: ['#00D4AA', '#00B894', '#00A085'],
    dark: ['#2D3436', '#636E72', '#B2BEC3'],
    card: ['#FFFFFF', '#F5F6FA', '#DFE6E9'],
    blue: ['#0984E3', '#74B9FF', '#A29BFE'],
    success: ['#00D4AA', '#00B894'],
    warning: ['#FDCB6E', '#F39C12'],
    info: ['#0984E3', '#74B9FF'],
  },
  background: {
    light: '#FFFFFF',
    dark: '#2D3436',
    surface: '#F5F6FA',
    card: '#FFFFFF',
    cardDark: '#636E72',
    overlay: 'rgba(45, 52, 54, 0.8)',
  },
  text: {
    primary: '#2D3436',
    secondary: '#636E72',
    light: '#FFFFFF',
    muted: '#B2BEC3',
    dark: '#2D3436',
  },
  status: {
    success: '#00D4AA',
    error: '#E17055',
    warning: '#FDCB6E',
    info: '#0984E3',
  },
} as const;

// ============================================
// OPTION 4 : "Neomorphic Minimal"
// Style : Soft UI / Neomorphism
// ============================================
export const ColorsNeomorphic = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Indigo
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  secondary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#8B5CF6', // Violet
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  accent: {
    gold: '#F59E0B',
    emerald: '#10B981',
    rose: '#EC4899',
    cyan: '#06B6D4',
    orange: '#F97316',
  },
  gradients: {
    primary: ['#6366F1', '#8B5CF6', '#A855F7'],
    dark: ['#1F2937', '#374151', '#4B5563'],
    card: ['#F3F4F6', '#E5E7EB', '#D1D5DB'],
    blue: ['#6366F1', '#818CF8'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    info: ['#6366F1', '#818CF8'],
  },
  background: {
    light: '#E5E7EB', // Gris clair pour néomorphisme
    dark: '#1F2937',
    surface: '#F3F4F6',
    card: '#F9FAFB',
    cardDark: '#374151',
    overlay: 'rgba(31, 41, 55, 0.8)',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#FFFFFF',
    muted: '#9CA3AF',
    dark: '#111827',
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#6366F1',
  },
} as const;

// ============================================
// OPTION 5 : "Ocean Blue" (Professionnel)
// ============================================
export const ColorsOceanBlue = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#2563EB', // Bleu océan
    600: '#1D4ED8',
    700: '#1E40AF',
    800: '#1E3A8A',
    900: '#1E3A8A',
  },
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#06B6D4', // Cyan
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  accent: {
    gold: '#F59E0B',
    emerald: '#10B981',
    rose: '#F43F5E',
    cyan: '#06B6D4',
    orange: '#F97316',
  },
  gradients: {
    primary: ['#2563EB', '#06B6D4', '#10B981'],
    dark: ['#0F172A', '#1E293B', '#334155'],
    card: ['#FFFFFF', '#F8FAFC'],
    blue: ['#2563EB', '#3B82F6', '#60A5FA'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    info: ['#2563EB', '#3B82F6'],
  },
  background: {
    light: '#F8FAFC',
    dark: '#0F172A',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardDark: '#1E293B',
    overlay: 'rgba(15, 23, 42, 0.8)',
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    light: '#FFFFFF',
    muted: '#94A3B8',
    dark: '#0F172A',
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#2563EB',
  },
} as const;

