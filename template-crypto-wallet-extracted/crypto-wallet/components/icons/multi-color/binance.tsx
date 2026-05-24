import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { MultiColorIconSvgProps } from "@/lib/types/icons";

const TILE_COLOR = "#181A20";
const MARK_COLOR = "#F0B90B";

export const BinanceSvg: React.FC<MultiColorIconSvgProps> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width={24} height={24} rx={6} fill={TILE_COLOR} />
    <Path d="M12 4 14.5 6.5 12 9 9.5 6.5Z" fill={MARK_COLOR} />
    <Path d="M17.5 9.5 20 12 17.5 14.5 15 12Z" fill={MARK_COLOR} />
    <Path d="M12 15 14.5 17.5 12 20 9.5 17.5Z" fill={MARK_COLOR} />
    <Path d="M6.5 9.5 9 12 6.5 14.5 4 12Z" fill={MARK_COLOR} />
  </Svg>
);
