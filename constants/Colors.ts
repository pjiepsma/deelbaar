import { mapColors } from '~/lib/constants/mapColors';

// Modern Design System for Deelbaar
const primary = mapColors.roadHighlight;
const secondary = mapColors.landscape;
const accent = mapColors.poiAccent;

export default {
  // Primary Brand Colors
  primary,
  primaryLight: '#F0EDE4',
  primaryDark: '#A79986',

  // Secondary Colors
  secondary,
  secondaryLight: '#F7F4EA',
  secondaryDark: '#B8AC98',

  // Accent Colors
  accent,
  accentLight: '#E6F1E4',
  accentDark: '#8EB78E',

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

  // Neutral Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    tertiary: '#F8F6F2',
    overlay: 'rgba(0, 0, 0, 0.5)',
    modal: 'rgba(0, 0, 0, 0.78)',
    surface: '#FFFFFF',
    surfaceDark: '#F0E8DB',
  },

  // Text Colors
  text: {
    primary: '#0F0D08',
    secondary: '#2B241A',
    tertiary: '#5B5144',
    inverse: '#FFFFFF',
    accent,
  },

  // Border Colors
  border: {
    light: '#DFD8CF',
    medium: '#C3B9AB',
    dark: '#958974',
    focus: primary,
  },

  // Legacy support (keeping old names for compatibility)
  light: '#F9F3EC',
  grey: '#5C564B',
  dark: '#2C2C29',
  white: '#FFFFFF',

  // Gradients for modern UI
  gradients: {
    primary: ['#A79986', '#F0EDE4'],
    secondary: ['#B8AC98', '#F7F4EA'],
    accent: ['#8EB78E', '#E6F1E4'],
    background: ['#F7F3EB', '#FFFFFF'],
  },

  // Shadow system
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.06)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
  },

  // Border radius system
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
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
