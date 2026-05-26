import * as Haptics from 'expo-haptics';

export function fireHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
): void {
  Haptics.impactAsync(style).catch((): void => {});
}
