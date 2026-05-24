import React from "react";
import Svg, { Circle, Rect } from "react-native-svg";

import type { MultiColorIconSvgProps } from "@/lib/types/icons";

const TILE_COLOR = "#0052FF";
const MARK_COLOR = "#FFFFFF";

export const CoinbaseSvg: React.FC<MultiColorIconSvgProps> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width={24} height={24} rx={6} fill={TILE_COLOR} />
    <Circle cx={12} cy={12} r={5.5} fill={MARK_COLOR} />
    <Circle cx={12} cy={12} r={2.25} fill={TILE_COLOR} />
  </Svg>
);
