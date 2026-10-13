import { Image, type StyleProp, type ImageStyle } from 'react-native';

import { DOODLES, type DoodleId, JOIN_CARD_DOODLE_SIZE } from './doodles';

type Props = {
  id: DoodleId;
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function DoodleImage({
  id,
  size = JOIN_CARD_DOODLE_SIZE,
  style,
  accessibilityLabel,
}: Props) {
  return (
    <Image
      source={DOODLES[id]}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size, backgroundColor: 'transparent' }, style]}
      resizeMode="contain"
    />
  );
}
