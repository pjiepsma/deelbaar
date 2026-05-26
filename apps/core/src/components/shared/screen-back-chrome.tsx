import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { PLACE_DETAIL_HORIZONTAL_PADDING } from '../../features/listings/placeDetail.constants';
import { HeroChromeButton } from '../../features/listings/HeroChromeButton';

const TOP_CHROME_PADDING = 8;

type ScreenBackChromeProps = {
  onBack: () => void;
  accessibilityLabel: string;
};

export function ScreenBackChrome({ onBack, accessibilityLabel }: ScreenBackChromeProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingTop: insets.top + TOP_CHROME_PADDING,
        paddingHorizontal: PLACE_DETAIL_HORIZONTAL_PADDING,
      }}
    >
      <HeroChromeButton onPress={onBack} accessibilityLabel={accessibilityLabel}>
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </HeroChromeButton>
    </View>
  );
}
