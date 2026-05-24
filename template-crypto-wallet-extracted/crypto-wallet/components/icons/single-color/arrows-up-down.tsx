import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

/**
 * Vertical counterpart of `arrows-left-right`. The shared gravity-ui glyph
 * is reused via a 90deg rotation around the viewBox centre so both swap
 * icons stay visually consistent.
 *
 * @see https://github.com/gravity-ui/icons/blob/main/svgs/arrow-right-arrow-left.svg
 */
export const ArrowsUpDownSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Rect width={16} height={16} fill="none" />
    <Path
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
      transform="rotate(90 8 8)"
      d="M13.78 3.72a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06L11.44 5H2.75a.75.75 0 1 1 0-1.5h8.69L9.72 1.78A.75.75 0 0 1 10.78.72zM2 11.75a.75.75 0 0 1 .22-.53l3-3a.75.75 0 1 1 1.06 1.06L4.56 11h8.69a.75.75 0 0 1 0 1.5H4.56l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1-.22-.53"
    />
  </Svg>
);
