import * as Haptics from "expo-haptics";

/**
 * Fire-and-forget impact haptic. Swallows rejections so callers can safely
 * invoke this from gesture handlers on platforms (e.g. web) where the native
 * haptic engine is unavailable.
 */
export const fireHaptic = (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
): void => {
  Haptics.impactAsync(style).catch((): void => {});
};
