import React from "react";
import Svg, { Circle, G, Polygon } from "react-native-svg";

import type { MultiColorIconSvgProps } from "@/lib/types/icons";

// Embeds the official Ethereum mark (source viewBox 784.37 x 1277.39) inside
// the 24x24 disc at ~60% height so the faceted glyph stays legible at chip
// sizes (28-44 px).
const MARK_TRANSFORM = "translate(7.58 4.8) scale(0.01127)";

export const EthSvg: React.FC<MultiColorIconSvgProps> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={12} fill="#FFFFFF" />
    <G transform={MARK_TRANSFORM}>
      <Polygon
        fill="#343434"
        fillRule="nonzero"
        points="392.07,0 383.5,29.11 383.5,873.74 392.07,882.29 784.13,650.54"
      />
      <Polygon
        fill="#8C8C8C"
        fillRule="nonzero"
        points="392.07,0 0,650.54 392.07,882.29 392.07,472.33"
      />
      <Polygon
        fill="#3C3C3B"
        fillRule="nonzero"
        points="392.07,956.52 387.24,962.41 387.24,1263.28 392.07,1277.38 784.37,724.89"
      />
      <Polygon fill="#8C8C8C" fillRule="nonzero" points="392.07,1277.38 392.07,956.52 0,724.89" />
      <Polygon
        fill="#141414"
        fillRule="nonzero"
        points="392.07,882.29 784.13,650.54 392.07,472.33"
      />
      <Polygon fill="#393939" fillRule="nonzero" points="0,650.54 392.07,882.29 392.07,472.33" />
    </G>
  </Svg>
);
