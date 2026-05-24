import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

/** @see https://github.com/gravity-ui/icons/blob/main/svgs/house-fill.svg */
export const HomeFillSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Rect width={16} height={16} fill="none" />
    <Path
      fill={color}
      d="M6.17 1.907a3 3 0 0 1 3.66 0l3.5 2.693a3 3 0 0 1 1.17 2.378V11.5a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3V6.978A3 3 0 0 1 2.67 4.6zM7 8c-.69 0-1.25.56-1.25 1.25V13h4.5V9.25C10.25 8.56 9.69 8 9 8z"
    />
  </Svg>
);
