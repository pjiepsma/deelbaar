import { PressableFeedback } from 'heroui-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { PLACE_DETAIL_HERO_CHROME_SIZE } from './placeDetail.constants';

type HeroChromeButtonProps = {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
};

export function HeroChromeButton({ children, onPress, accessibilityLabel }: HeroChromeButtonProps) {
  return (
    <View
      style={{
        width: PLACE_DETAIL_HERO_CHROME_SIZE,
        height: PLACE_DETAIL_HERO_CHROME_SIZE,
        borderRadius: PLACE_DETAIL_HERO_CHROME_SIZE / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
        elevation: 5,
      }}
    >
      <PressableFeedback onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <View
          style={{
            width: PLACE_DETAIL_HERO_CHROME_SIZE,
            height: PLACE_DETAIL_HERO_CHROME_SIZE,
            borderRadius: PLACE_DETAIL_HERO_CHROME_SIZE / 2,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      </PressableFeedback>
    </View>
  );
}
