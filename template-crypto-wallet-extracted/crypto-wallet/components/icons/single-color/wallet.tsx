import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

// Combines stroke outlines + a fill dot, but a single `color` drives every
// painted attribute so the glyph still themes as one color.
export const WalletSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width={24} height={24} fill="none" />
    <Path
      d="M3 8.5A2.5 2.5 0 0 1 5.5 6H17a2 2 0 0 1 2 2v.5"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M3 8.5v9A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 18.5 8H5.5A2.5 2.5 0 0 1 3 5.5"
      stroke={color}
      strokeWidth={1.75}
      strokeLinejoin="round"
      fill="none"
    />
    <Path d="M16.5 14.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" fill={color} />
  </Svg>
);
