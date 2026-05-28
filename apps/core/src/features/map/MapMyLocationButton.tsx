import { Ionicons } from '@expo/vector-icons';

import { HeroChromeButton } from '../listings/HeroChromeButton';

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
};

export function MapMyLocationButton({ onPress, accessibilityLabel }: Props) {
  return (
    <HeroChromeButton onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <Ionicons name="locate" size={22} color="#1A1A1A" />
    </HeroChromeButton>
  );
}
