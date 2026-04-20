import { Platform, TextStyle } from 'react-native';

import Colors from './Colors';

/**
 * Semantic type scale (approximate mapping to Material Design 3 + iOS HIG).
 *
 * - M3: bodyLarge 16sp, titleLarge 22sp, headlineSmall 24sp, titleMedium 16sp medium
 * - iOS (default): .title2 22pt, .title3 20pt, .body 17pt, .subheadline 15pt
 *
 * We use compact screen titles (~20–22pt) so in-screen headings stay below the nav bar
 * title and don’t compete with display sizes.
 */
const androidTextMetrics: TextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: {},
}) as TextStyle;

/** Primary in-screen title (forms, settings intros) — ~iOS Title 3 / M3 emphasis */
export const screenTitle: TextStyle = {
  fontSize: 20,
  lineHeight: 26,
  fontWeight: '600',
  letterSpacing: -0.2,
};

/** Centered auth / recovery hero line — ~iOS Title 2 / M3 titleLarge */
export const screenTitleLarge: TextStyle = {
  fontSize: 22,
  lineHeight: 28,
  fontWeight: '600',
  letterSpacing: -0.25,
};

/** Card sections, list group headers */
export const sectionTitle: TextStyle = {
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '600',
};

/**
 * Text field value + placeholder (React Native uses one fontSize for both).
 * M3 body large; Android includeFontPadding avoids oversized-looking placeholders.
 */
export const inputText: TextStyle = {
  fontSize: 16,
  lineHeight: 22,
  fontWeight: '400',
  ...androidTextMetrics,
};

/** Slightly softer than default gray placeholders */
export const inputPlaceholderColor = Colors.text.caption;

/** Stack/tab header title — `fontSize`/`fontWeight` only (RN header typings omit lineHeight). */
export const navigationTitle: Pick<TextStyle, 'fontSize' | 'fontWeight' | 'letterSpacing'> = {
  fontSize: 17,
  fontWeight: '600',
  letterSpacing: -0.2,
};

export const Typography = {
  screenTitle,
  screenTitleLarge,
  sectionTitle,
  navigationTitle,
  inputText,
  inputPlaceholderColor,
} as const;
