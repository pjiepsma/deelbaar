import React from "react";
import Svg, { G, Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

// Mirrors `trend-up` across the horizontal axis (Gravity ships no `trend-down`
// counterpart, so we flip the chart-line-arrow-up path in place).
export const TrendDownSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Rect width={16} height={16} fill="none" />
    <G transform="translate(0 16) scale(1 -1)">
      <Path
        fill={color}
        d="M14.75 12.5a.75.75 0 0 1 0 1.5H1.25a.75.75 0 0 1 0-1.5zm-.5-10a.75.75 0 0 1 .75.75V6.5a.75.75 0 0 1-1.5 0V5.06l-3.241 3.242a2.25 2.25 0 0 1-2.505.465L5.335 7.69a.75.75 0 0 0-.923.261l-2.044 2.973a.75.75 0 0 1-1.236-.85l2.044-2.972a2.25 2.25 0 0 1 2.767-.782l2.42 1.075a.75.75 0 0 0 .835-.155L12.44 4H11a.75.75 0 0 1 0-1.5z"
      />
    </G>
  </Svg>
);
