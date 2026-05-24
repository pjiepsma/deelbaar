import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

// Authored on a 24x24 grid (Material-style search proportions) rather than
// Gravity UI's tighter 16x16 magnifier — a small filled disc sits inside the
// ring body so the focused state reads as a "loaded" lens.
export const SearchFillSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width={24} height={24} fill="none" />
    <Path fill={color} d="M16 11a5 5 0 1 1-10 0a5 5 0 0 1 10 0" />
    <Path
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 11a9 9 0 1 1 16.032 5.618l3.675 3.675a1 1 0 0 1-1.414 1.414l-3.675-3.675A9 9 0 0 1 2 11m9-7a7 7 0 1 0 0 14a7 7 0 0 0 0-14"
    />
  </Svg>
);
