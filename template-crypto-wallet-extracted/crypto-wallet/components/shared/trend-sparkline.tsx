import { LinearGradient, vec } from "@shopify/react-native-skia";
import { colorKit, useThemeColor } from "heroui-native";
import { AreaChart, LineChart } from "heroui-native-pro";
import { View } from "react-native";

import type { AssetSeriesPoint } from "@/lib/types/asset";

export type SparklineTrend = "up" | "neutral" | "down";

export interface TrendSparklineProps {
  series: readonly AssetSeriesPoint[];
  trend: SparklineTrend;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 72;
const DEFAULT_HEIGHT = 32;

export const TrendSparkline = ({
  series,
  trend,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}: TrendSparklineProps): React.ReactElement => {
  const [successColor, dangerColor, mutedColor] = useThemeColor(["success", "danger", "muted"]);

  const strokeColor = trend === "up" ? successColor : trend === "down" ? dangerColor : mutedColor;
  const topColor = colorKit.setAlpha(strokeColor, 0.9).hex();
  const bottomColor = colorKit.setAlpha(strokeColor, 0.02).hex();

  return (
    // `pointerEvents="none"` lets the surrounding row stay pressable - the
    // sparkline is purely visual and would otherwise intercept touches.
    <View pointerEvents="none" style={{ width, height }}>
      <AreaChart
        data={[...series]}
        xKey="x"
        yKeys={["value"]}
        // Hide axis tick labels - the sparkline has no axes by design.
        xAxis={{ font: null }}
        yAxis={[{ font: null, lineWidth: 0 }]}
        domainPadding={{ top: 2, bottom: 2 }}
        wrapperClassName="h-full w-full"
      >
        {({ points, chartBounds }) => (
          <>
            <AreaChart.Area points={points.value} y0={chartBounds.bottom} curveType="natural">
              <LinearGradient
                colors={[topColor, bottomColor]}
                start={vec(0, chartBounds.top)}
                end={vec(0, chartBounds.bottom)}
              />
            </AreaChart.Area>
            <LineChart.AnimatedLine
              points={points.value}
              curveType="natural"
              color={strokeColor}
              strokeWidth={1.5}
              animation={{ type: "timing", duration: 800 }}
            />
          </>
        )}
      </AreaChart>
    </View>
  );
};
