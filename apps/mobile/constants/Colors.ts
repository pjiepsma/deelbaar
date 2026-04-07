// Professional palette: Slate + Emerald (Tailwind/shadcn-style)
// 60-30-10 rule, WCAG AA compliant

const primary = '#059669'; // emerald-600
const primaryLight = '#10b981'; // emerald-500
const primaryDark = '#047857'; // emerald-700

export default {
  // Primary Brand Colors
  primary,
  primaryLight,
  primaryDark,

  // Secondary Colors (supporting structure)
  secondary: '#f1f5f9', // slate-100
  secondaryLight: '#f8fafc', // slate-50
  secondaryDark: '#e2e8f0', // slate-200

  // Accent Colors
  accent: '#0d9488', // teal-600
  accentLight: '#2dd4bf', // teal-400
  accentDark: '#0f766e', // teal-700

  // Semantic Colors
  success: '#22C55E',
  successLight: '#86EFAC',
  successDark: '#16A34A',

  warning: '#F59E0B',
  warningLight: '#FED7AA',
  warningDark: '#D97706',

  error: '#EF4444',
  errorLight: '#FCA5A5',
  errorDark: '#DC2626',

  info: '#3B82F6',
  infoLight: '#93C5FD',
  infoDark: '#1D4ED8',

  // Neutral Backgrounds (60% dominant, 30% secondary)
  background: {
    primary: '#f8fafc', // slate-50 - main canvas
    secondary: '#ffffff', // white - cards, inputs
    tertiary: '#f1f5f9', // slate-100 - search bar, filter panel
    overlay: 'rgba(0, 0, 0, 0.5)',
    modal: 'rgba(0, 0, 0, 0.78)',
    surface: '#ffffff',
    surfaceDark: '#e2e8f0', // slate-200
  },

  // Text Colors (WCAG AA compliant)
  text: {
    primary: '#0f172a', // slate-900
    secondary: '#475569', // slate-600 - 4.5:1 on white
    tertiary: '#64748b', // slate-500 - muted labels
    inverse: '#ffffff',
    accent: primary,
  },

  // Border Colors
  border: {
    light: '#e2e8f0', // slate-200
    medium: '#cbd5e1', // slate-300
    dark: '#94a3b8', // slate-400
    focus: primary,
  },

  // Legacy support (keeping old names for compatibility)
  light: '#f8fafc',
  grey: '#64748b',
  dark: '#0f172a',
  white: '#FFFFFF',

  // Gradients for modern UI
  gradients: {
    primary: [primaryDark, primaryLight],
    secondary: ['#0f766e', '#2dd4bf'],
    accent: [primaryDark, '#2dd4bf'],
    background: ['#f1f5f9', '#ffffff'],
  },

  // Shadow system
  // CSS strings for web; use shadowTokens for React Native
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.06)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
  },

  /**
   * React Native shadow tokens (design plan: softer for inputs, stronger for cards).
   * Spread into style objects: { ...Colors.shadowTokens.sm }
   */
  shadowTokens: {
    sm: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
  } as const,

  // Border radius system (sm: 8, md: 12, lg: 16, xl: 20)
  radius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Spacing system (multiples of 4)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
};
