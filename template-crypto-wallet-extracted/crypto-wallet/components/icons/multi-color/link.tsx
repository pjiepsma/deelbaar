import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";

import type { MultiColorIconSvgProps } from "@/lib/types/icons";

// Embeds the official Chainlink mark (source viewBox 37.8 x 43.6) inside the
// 24x24 disc at ~60% height so the hexagon stays readable at chip sizes
// (28-44 px).
const MARK_TRANSFORM = "translate(5.76 4.8) scale(0.3303)";
const MARK_FILL = "#2A5ADA";

export const LinkSvg: React.FC<MultiColorIconSvgProps> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={12} fill="#FFFFFF" />
    <G transform={MARK_TRANSFORM}>
      <Path
        fill={MARK_FILL}
        d="M18.9,0l-4,2.3L4,8.6,0,10.9V32.7L4,35l11,6.3,4,2.3,4-2.3L33.8,35l4-2.3V10.9l-4-2.3L22.9,2.3ZM8,28.1V15.5L18.9,9.2l10.9,6.3V28.1L18.9,34.4Z"
      />
    </G>
  </Svg>
);
