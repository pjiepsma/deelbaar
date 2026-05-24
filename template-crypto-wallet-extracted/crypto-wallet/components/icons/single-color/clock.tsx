import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

/** @see https://github.com/gravity-ui/icons/blob/main/svgs/clock.svg */
export const ClockSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Rect width={16} height={16} fill="none" />
    <Path
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.5 8a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0M8.75 4.5a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 .3.6l2 1.5a.75.75 0 1 0 .9-1.2l-1.7-1.275z"
    />
  </Svg>
);
