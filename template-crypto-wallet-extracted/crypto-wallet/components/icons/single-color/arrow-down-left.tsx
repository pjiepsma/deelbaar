import React from "react";
import Svg, { G, Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

/** @see https://github.com/gravity-ui/icons/blob/main/svgs/arrow-down-left.svg */
export const ArrowDownLeftSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Rect width={16} height={16} fill="none" />
    <G fill={color}>
      <Path d="M12.197 2.741a.75.75 0 0 1 1.06 1.061l-8.175 8.176h3.847a.75.75 0 0 1-.001 1.5H3.27a.75.75 0 0 1-.75-.75V7.073a.75.75 0 0 1 1.5 0v3.845z" />
      <Path d="M12.198 2.741a.75.75 0 0 1 1.06 1.061l-8.175 8.176h3.846a.75.75 0 0 1 0 1.5H3.27a.75.75 0 0 1-.75-.75V7.072a.751.751 0 0 1 1.501 0v3.846z" />
    </G>
  </Svg>
);
