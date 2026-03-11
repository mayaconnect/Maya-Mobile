/**
 * Maya Connect V2 — Design System Colors
 * Orange primary (#FF6A00) + Navy accent (#1F2A44)
 * Light gray backgrounds (#F5F6FA) + White cards (#FFFFFF)
 */

export const colors = {
  // ── Primary Orange ──
  orange: {
    50: '#FFF4EC',
    100: '#FFE4CC',
    200: '#FFCDA3',
    300: '#FFB070',
    400: '#FF8A33',
    500: '#FF6A00',
    600: '#E05E00',
    700: '#B84D00',
    800: '#8F3B00',
    900: '#6B2D00',
  },

  // ── Navy / Dark Blue (replaces violet) ──
  violet: {
    50: '#F0F1F5',
    100: '#DDE0E8',
    200: '#B5BAC8',
    300: '#8D94A8',
    400: '#5C6580',
    500: '#2F3A56',
    600: '#1F2A44',
    700: '#192236',
    800: '#131A2A',
    900: '#0D1320',
  },

  // ── Neutrals ──
  neutral: {
    0: '#FFFFFF',
    50: '#F5F6FA',
    100: '#ECEDF3',
    200: '#E2E3EB',
    300: '#CBD0DC',
    400: '#94A0B8',
    500: '#64708B',
    600: '#475569',
    700: '#334155',
    800: '#1F2A44',
    900: '#0F172A',
    950: '#020617',
  },

  // ── Semantic ──
  success: {
    50: '#ECFDF5',
    100: '#ECFDF5',
    400: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    400: '#FEE2E2',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2', 
    400: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },

  // ── Gradients (as arrays for LinearGradient) ──
  gradients: {
    primary: ['#FF6A00', '#FF8A33'] as const,
    accent: ['#1F2A44', '#2F3A56'] as const,
    hero: ['#FF6A00', '#1F2A44'] as const,
    heroReverse: ['#1F2A44', '#FF6A00'] as const,
    dark: ['#0D1320', '#1F2A44'] as const,
    sunset: ['#FF6A00', '#F59E0B'] as const,
    card: ['#FFFFFF', '#F5F6FA'] as const,
    cardDark: ['#1F2A44', '#0D1320'] as const,
  },
  // ── Shorthand Gradient Arrays (direct access) ──
  orangeGradient: ['#FF6A00', '#FF8A33'] as readonly string[],
  violetGradient: ['#1F2A44', '#2F3A56'] as readonly string[],
  heroGradient: ['#FF6A00', '#1F2A44'] as readonly string[],
} as const;

/** Named gradient export for convenience */
export const gradients = colors.gradients;

export type ColorToken = typeof colors;

/* ================================================================== */
/*  Role-specific Color Palettes                                       */
/*                                                                     */
/*  Same token structure as `colors` so screens only need to swap the  */
/*  import:  import { clientColors as colors } from …                  */
/*  All existing colors.orange[500], colors.neutral[900], etc.         */
/*  automatically resolve to the role-appropriate values.              */
/* ================================================================== */

/**
 * 🟠 CLIENT — Dark theme, startup / modern UI
 * Primary: #FF7A18  |  Accent: #38BDF8 (soft blue)
 * Background: #0F172A  |  Cards: #1E293B
 */
export const clientColors = {
  orange: {
    50: 'rgba(255,122,24,0.15)',
    100: 'rgba(255,122,24,0.2)',
    200: '#FFB347',
    300: '#FFB347',
    400: '#FF7A18',
    500: '#FF7A18',
    600: '#FF8F3A',
    700: '#E06B10',
    800: '#B85600',
    900: '#8F4200',
  },
  violet: {
    50: 'rgba(56,189,248,0.12)',
    100: 'rgba(56,189,248,0.15)',
    200: 'rgba(56,189,248,0.2)',
    300: 'rgba(56,189,248,0.3)',
    400: '#38BDF8',
    500: '#38BDF8',
    600: '#38BDF8',
    700: '#0EA5E9',
    800: '#0284C7',
    900: '#075985',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#0F172A',
    100: '#1E293B',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
    700: '#E5E7EB',
    800: '#F1F5F9',
    900: '#FFFFFF',
    950: '#020617',
  },
  success: {
    50: 'rgba(34,197,94,0.12)',
    100: 'rgba(34,197,94,0.15)',
    400: 'rgba(34,197,94,0.2)',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    50: 'rgba(245,158,11,0.12)',
    100: 'rgba(245,158,11,0.15)',
    400: 'rgba(245,158,11,0.2)',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: 'rgba(239,68,68,0.12)',
    100: 'rgba(239,68,68,0.15)',
    400: 'rgba(239,68,68,0.2)',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: 'rgba(56,189,248,0.12)',
    100: 'rgba(56,189,248,0.15)',
    500: '#38BDF8',
    600: '#0EA5E9',
    700: '#0284C7',
  },
  gradients: {
    primary: ['#FF7A18', '#FFB347'] as const,
    accent: ['#0F172A', '#1E293B'] as const,
    hero: ['#FF7A18', '#0F172A'] as const,
    heroReverse: ['#0F172A', '#FF7A18'] as const,
    dark: ['#020617', '#0F172A'] as const,
    sunset: ['#FF7A18', '#FFB347'] as const,
    card: ['#1E293B', '#0F172A'] as const,
    cardDark: ['#0F172A', '#020617'] as const,
  },
  orangeGradient: ['#FF7A18', '#FFB347'] as readonly string[],
  violetGradient: ['#0F172A', '#1E293B'] as readonly string[],
  heroGradient: ['#FF7A18', '#0F172A'] as readonly string[],
} as const;

/**
 * 🏢 STORE OPERATOR — Light theme, clean product design (Notion/Linear style)
 * Primary: #FF7A18  |  Accent: #3B82F6 (blue)
 * Background: #F8FAFC  |  Cards: #FFFFFF
 */
export const operatorColors = {
  orange: {
    50: 'rgba(255,122,24,0.08)',
    100: '#FFEDD5',
    200: '#FFD6A5',
    300: '#FFB347',
    400: '#FF9F45',
    500: '#FF7A18',
    600: '#FF8F3A',
    700: '#E06B10',
    800: '#B85600',
    900: '#8F4200',
  },
  violet: {
    50: 'rgba(59,130,246,0.08)',
    100: 'rgba(59,130,246,0.1)',
    200: 'rgba(59,130,246,0.15)',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#3B82F6',
    700: '#2563EB',
    800: '#1D4ED8',
    900: '#1E40AF',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    400: '#D1FAE5',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    400: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    400: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  gradients: {
    primary: ['#FF7A18', '#FF9F45'] as const,
    accent: ['#FF7A18', '#FF9F45'] as const,
    hero: ['#FF7A18', '#F8FAFC'] as const,
    heroReverse: ['#F8FAFC', '#FF7A18'] as const,
    dark: ['#0F172A', '#1E293B'] as const,
    sunset: ['#FF7A18', '#FF9F45'] as const,
    card: ['#FFFFFF', '#F8FAFC'] as const,
    cardDark: ['#1E293B', '#0F172A'] as const,
  },
  orangeGradient: ['#FF7A18', '#FF9F45'] as readonly string[],
  violetGradient: ['#3B82F6', '#2563EB'] as readonly string[],
  heroGradient: ['#FF7A18', '#FF9F45'] as readonly string[],
} as const;

/**
 * 💎 PARTNER — Premium dark theme, AI/modern
 * Primary: #FF6A00  |  Accent: #22D3EE (electric cyan)
 * Background: #020617  |  Surface: #0F172A  |  Card: #111827
 */
export const partnerColors = {
  orange: {
    50: 'rgba(255,106,0,0.12)',
    100: 'rgba(255,106,0,0.18)',
    200: '#FFD580',
    300: '#FFB347',
    400: '#FF8A33',
    500: '#FF6A00',
    600: '#FF7A18',
    700: '#E05E00',
    800: '#B84D00',
    900: '#8F3B00',
  },
  violet: {
    50: 'rgba(34,211,238,0.1)',
    100: 'rgba(34,211,238,0.15)',
    200: 'rgba(34,211,238,0.2)',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#22D3EE',
    600: '#22D3EE',
    700: '#06B6D4',
    800: '#0891B2',
    900: '#0E7490',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#020617',
    100: '#0F172A',
    200: '#1E293B',
    300: '#374151',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#F9FAFB',
    950: '#000000',
  },
  success: {
    50: 'rgba(34,197,94,0.1)',
    100: 'rgba(34,197,94,0.15)',
    400: 'rgba(34,197,94,0.2)',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    50: 'rgba(245,158,11,0.1)',
    100: 'rgba(245,158,11,0.15)',
    400: 'rgba(245,158,11,0.2)',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: 'rgba(239,68,68,0.1)',
    100: 'rgba(239,68,68,0.15)',
    400: 'rgba(239,68,68,0.2)',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: 'rgba(34,211,238,0.1)',
    100: 'rgba(34,211,238,0.15)',
    500: '#22D3EE',
    600: '#06B6D4',
    700: '#0891B2',
  },
  gradients: {
    primary: ['#FF6A00', '#FFB347'] as const,
    accent: ['#020617', '#0F172A'] as const,
    hero: ['#FF6A00', '#020617'] as const,
    heroReverse: ['#020617', '#FF6A00'] as const,
    dark: ['#000000', '#020617'] as const,
    sunset: ['#FF6A00', '#FFB347', '#FFD580'] as const,
    card: ['#111827', '#0F172A'] as const,
    cardDark: ['#0F172A', '#020617'] as const,
  },
  orangeGradient: ['#FF6A00', '#FFB347'] as readonly string[],
  violetGradient: ['#020617', '#0F172A'] as readonly string[],
  heroGradient: ['#FF6A00', '#020617'] as readonly string[],
} as const;
