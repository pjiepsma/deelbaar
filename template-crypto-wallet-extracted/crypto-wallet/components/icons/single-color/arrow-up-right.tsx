import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

/** @see https://github.com/gravity-ui/icons/blob/main/svgs/arrow-up-right.svg */
export const ArrowUpRightSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Rect width={16} height={16} fill="none" />
    <Path
      fill={color}
      d="M12.728 2.521a.75.75 0 0 1 .75.75v5.657a.751.751 0 0 1-1.5 0V5.083l-8.176 8.176a.75.75 0 0 1-1.061-1.06l8.176-8.177H7.07a.75.75 0 0 1 .001-1.5z"
    />
  </Svg>
);
