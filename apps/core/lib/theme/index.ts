/**
 * Central theming for the React Native app.
 *
 * - **`useAppColors()`** — resolved palette (`Colors` shape) for StyleSheets, icons, RN views.
 * - **`useTheme()`** — full context: preference, `setPreference`, `resolvedTheme`, `colors`, `isDark`.
 * - **`useThemePreference()`** — same as `useTheme()` (legacy name kept for compatibility).
 *
 * Source tokens: `~/constants/Colors.ts` (light default export + `ColorsDark`). Uniwind theme is
 * synced from `resolvedTheme` in the root layout (`Uniwind.setTheme`).
 */

import { useThemePreference } from '~/lib/providers/ThemePreferenceProvider';

export type { AppColorPalette } from './types';
export type { ThemeContextValue, ThemePreference } from '~/lib/providers/ThemePreferenceProvider';
export { ThemePreferenceProvider, useThemePreference } from '~/lib/providers/ThemePreferenceProvider';
export { useAppColors } from '~/lib/hooks/useAppColors';

/** Prefer this name in new code; identical to `useThemePreference`. */
export function useTheme() {
  return useThemePreference();
}
