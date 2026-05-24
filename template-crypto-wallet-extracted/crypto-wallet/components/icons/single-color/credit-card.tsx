import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import type { SingleColorIconSvgProps } from "@/lib/types/icons";

/** @see https://github.com/gravity-ui/icons/blob/main/svgs/credit-card.svg */
export const CreditCardSvg: React.FC<SingleColorIconSvgProps> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16">
    <Rect width={16} height={16} fill="none" />
    <Path
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.5 4h-9A1.5 1.5 0 0 0 2 5.5h12A1.5 1.5 0 0 0 12.5 4M2 10.5V7h12v3.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 10.5m1.5-8a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-5a3 3 0 0 0-3-3zM4.25 9a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5z"
    />
  </Svg>
);
