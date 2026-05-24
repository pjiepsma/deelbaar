import React from "react";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

import type { MultiColorIconSvgProps } from "@/lib/types/icons";

// Embeds the official Solana mark (source viewBox 397.7 x 311.7) inside the
// 24x24 disc at ~60% width so the gradient stripes stay readable at chip
// sizes (28-44 px).
const MARK_TRANSFORM = "translate(4.8 6.36) scale(0.0362)";
// Vertical flip across y=157 preserves the source artwork's stripe direction
// while each path keeps its own neon-green -> magenta gradient.
const GRADIENT_FLIP = "matrix(1 0 0 -1 0 314)";

export const SolSvg: React.FC<MultiColorIconSvgProps> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Defs>
      <LinearGradient
        id="solGradTop"
        gradientUnits="userSpaceOnUse"
        gradientTransform={GRADIENT_FLIP}
        x1="360.8791"
        y1="351.4553"
        x2="141.213"
        y2="-69.2936"
      >
        <Stop offset="0" stopColor="#00FFA3" />
        <Stop offset="1" stopColor="#DC1FFF" />
      </LinearGradient>
      <LinearGradient
        id="solGradBottom"
        gradientUnits="userSpaceOnUse"
        gradientTransform={GRADIENT_FLIP}
        x1="264.8291"
        y1="401.6014"
        x2="45.163"
        y2="-19.1475"
      >
        <Stop offset="0" stopColor="#00FFA3" />
        <Stop offset="1" stopColor="#DC1FFF" />
      </LinearGradient>
      <LinearGradient
        id="solGradMiddle"
        gradientUnits="userSpaceOnUse"
        gradientTransform={GRADIENT_FLIP}
        x1="312.5484"
        y1="376.688"
        x2="92.8822"
        y2="-44.061"
      >
        <Stop offset="0" stopColor="#00FFA3" />
        <Stop offset="1" stopColor="#DC1FFF" />
      </LinearGradient>
    </Defs>
    <Circle cx={12} cy={12} r={12} fill="#000000" />
    <G transform={MARK_TRANSFORM}>
      <Path
        fill="url(#solGradTop)"
        d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"
      />
      <Path
        fill="url(#solGradBottom)"
        d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"
      />
      <Path
        fill="url(#solGradMiddle)"
        d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"
      />
    </G>
  </Svg>
);
