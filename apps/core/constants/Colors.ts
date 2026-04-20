/**
 * Raw color tokens (light default export + `ColorsDark`).
 *
 * **Do not import the default export in UI for theme-aware styling** — use
 * `useAppColors()` / `useTheme()` from `~/lib/theme` so light/dark follow
 * Account → Weergave and system preference.
 */

/**
 * Two-tone palette + Bricolage Grotesque (fonts loaded in root layout).
 * Paper #FBFBFB, ink #3E3131 — inspired by the travel-board reference.
 */

const paper = '#FBFBFB';
const paperElevated = '#FFFFFF';
const ink = '#3E3131';
const inkDark = '#2A2222';

/** Neutral grays for secondary / caption (reference-style, not brown-tinted ink) */
const gray600 = '#6B6B6B';
const gray500 = '#8F8F8F';
const gray400 = '#A3A3A3';

const colorsLight = {
  primary: ink,
  primaryLight: '#5C4F4F',
  primaryDark: inkDark,

  secondary: '#F2EFEF',
  secondaryLight: paperElevated,
  secondaryDark: '#E5E0E0',

  accent: ink,
  accentLight: '#5C4F4F',
  accentDark: inkDark,

  success: '#3D5A3D',
  successLight: '#E8F0E8',
  successDark: '#2F472F',

  warning: '#8A6A3E',
  warningLight: '#F5EFE3',
  warningDark: '#6B522F',

  error: '#8F3D3D',
  errorLight: '#F7EAEA',
  errorDark: '#6F3030',

  info: ink,
  infoLight: paperElevated,
  infoDark: inkDark,

  background: {
    primary: paper,
    secondary: paperElevated,
    tertiary: '#F2EFEF',
    overlay: 'rgba(62, 49, 49, 0.35)',
    modal: 'rgba(62, 49, 49, 0.55)',
    surface: paperElevated,
    surfaceDark: '#E8E4E4',
  },

  text: {
    primary: ink,
    /** Subheadings, secondary lines */
    secondary: gray600,
    /** Helper text, inactive tabs, descriptions */
    tertiary: gray500,
    /** Smallest labels / meta (use with smaller font sizes) */
    caption: gray400,
    inverse: paper,
    accent: ink,
  },

  /**
   * Vector icons (tabs, header, map chrome) — light pastel brown / taupe tints on paper.
   */
  icon: {
    /** Selected tab, back button, primary toolbar icons */
    active: '#7A6B65',
    /** Unselected tab icons, very soft */
    inactive: '#C9BCB5',
    /** Search / secondary glyphs, disabled */
    muted: '#ADA39D',
  },

  border: {
    light: 'rgba(62, 49, 49, 0.12)',
    medium: 'rgba(62, 49, 49, 0.2)',
    dark: 'rgba(62, 49, 49, 0.35)',
    focus: ink,
  },

  light: paper,
  grey: gray500,
  dark: ink,
  white: paperElevated,

  gradients: {
    primary: [ink, inkDark] as [string, string],
    secondary: [paper, paperElevated] as [string, string],
    accent: [ink, '#4A3D3D'] as [string, string],
    background: [paper, paperElevated] as [string, string],
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(62, 49, 49, 0.06)',
    md: '0 4px 6px -1px rgba(62, 49, 49, 0.08), 0 2px 4px -1px rgba(62, 49, 49, 0.04)',
    lg: '0 10px 15px -3px rgba(62, 49, 49, 0.1), 0 4px 6px -2px rgba(62, 49, 49, 0.05)',
    xl: '0 20px 25px -5px rgba(62, 49, 49, 0.12), 0 10px 10px -5px rgba(62, 49, 49, 0.06)',
  },

  shadowTokens: {
    /** Map listing carousel — border does most of the work; keep lift minimal */
    mapCard: {
      shadowColor: ink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    sm: {
      shadowColor: ink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 6,
    },
  } as const,

  radius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

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

/**
 * Dark surfaces: warm ink; text and chrome stay on-brand (paper-tinted, not pure white).
 */
export const ColorsDark = {
  primary: '#D2C9C6',
  primaryLight: '#E8E4E4',
  primaryDark: '#B8AEAA',

  secondary: '#2E2828',
  secondaryLight: '#363030',
  secondaryDark: '#242020',

  accent: '#D2C9C6',
  accentLight: '#E8E4E4',
  accentDark: '#B8AEAA',

  success: '#8FBC8F',
  successLight: '#2A3A2A',
  successDark: '#6FA06F',

  warning: '#D4B896',
  warningLight: '#3A3228',
  warningDark: '#B89A6E',

  error: '#D48A8A',
  errorLight: '#3A2828',
  errorDark: '#B56565',

  info: '#D2C9C6',
  infoLight: '#363030',
  infoDark: '#B8AEAA',

  background: {
    primary: '#1A1616',
    secondary: '#242020',
    tertiary: '#2E2828',
    overlay: 'rgba(0, 0, 0, 0.45)',
    modal: 'rgba(0, 0, 0, 0.62)',
    surface: '#242020',
    surfaceDark: '#1A1616',
  },

  text: {
    primary: '#F5F2F2',
    secondary: '#A89F9C',
    tertiary: '#8A807E',
    caption: '#6B6563',
    inverse: ink,
    accent: '#E8E4E4',
  },

  icon: {
    active: '#C9BCB5',
    inactive: '#5C5554',
    muted: '#6B6563',
  },

  border: {
    light: 'rgba(245, 242, 242, 0.1)',
    medium: 'rgba(245, 242, 242, 0.16)',
    dark: 'rgba(245, 242, 242, 0.26)',
    focus: '#D2C9C6',
  },

  light: '#1A1616',
  grey: '#8A807E',
  dark: '#F5F2F2',
  white: '#242020',

  gradients: {
    primary: ['#3A3232', '#2A2424'] as [string, string],
    secondary: ['#1A1616', '#242020'] as [string, string],
    accent: ['#D2C9C6', '#B8AEAA'] as [string, string],
    background: ['#1A1616', '#242020'] as [string, string],
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.28)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.45), 0 4px 6px -2px rgba(0, 0, 0, 0.32)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.35)',
  },

  shadowTokens: {
    mapCard: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
      shadowRadius: 3,
      elevation: 2,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.38,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.42,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.48,
      shadowRadius: 12,
      elevation: 7,
    },
  } as const,

  radius: colorsLight.radius,
  spacing: colorsLight.spacing,
};

export default colorsLight;
