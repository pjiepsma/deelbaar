import { createTamagui } from '@tamagui/core';
import { defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-rn';

// Tamagui 2: v5 config + RN animation driver. App screens style Tamagui with ~/constants/Colors;
// theme overrides here are optional; defaults follow Tamagui v5 palettes.
const appConfig = createTamagui({
  ...defaultConfig,
  animations,
  tokens: {
    ...defaultConfig.tokens,
    space: {
      ...defaultConfig.tokens.space,
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      7: 28,
      8: 32,
      9: 36,
      10: 40,
    },
    radius: {
      ...defaultConfig.tokens.radius,
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
    },
  },
});

export default appConfig;

export type Conf = typeof appConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
