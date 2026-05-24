import Svg, { G, Path } from 'react-native-svg';

import { DEELBAAR_MARK_PATH_D } from '../../branding/deelbaarMark';

type DeelbaarLogoProps = {
  color: string;
  maxHeight?: number;
};

const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 577;

export function DeelbaarLogo({ color, maxHeight = 56 }: DeelbaarLogoProps) {
  const width = (maxHeight * VIEWBOX_WIDTH) / VIEWBOX_HEIGHT;

  return (
    <Svg width={width} height={maxHeight} viewBox="0 0 600 577" fill="none" accessible={false}>
      <G transform="translate(0,577) scale(0.1,-0.1)" fill={color} stroke="none">
        <Path d={DEELBAAR_MARK_PATH_D} />
      </G>
    </Svg>
  );
}
