import { useThemePreference } from '~/lib/providers/ThemePreferenceProvider';

/**
 * Resolved light/dark palette — use for StyleSheets and non-Tamagui RN styling.
 * @see ~/lib/theme
 */
export function useAppColors() {
  const { colors } = useThemePreference();
  return colors;
}
