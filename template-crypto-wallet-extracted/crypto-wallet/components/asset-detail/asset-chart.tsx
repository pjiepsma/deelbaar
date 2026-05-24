import { AreaChart, ChartCrosshair, ChartIndicator, LineChart, Segment } from "heroui-native-pro";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useChartPressState, type ChartBounds } from "victory-native";

import { TIMEFRAMES } from "@/lib/mocks/assets";
import type { Asset, AssetSeriesPoint, AssetTimeframe } from "@/lib/types/asset";
import { fireHaptic } from "@/lib/utils/fire-haptic";
import { LinearGradient, vec } from "@shopify/react-native-skia";
import { colorKit } from "heroui-native";
import { useCSSVariable } from "uniwind";

const isAssetTimeframe = (value: string): value is AssetTimeframe => {
  return TIMEFRAMES.some((tf) => tf === value);
};

const resolveGradientBaseColor = (
  token: string | number | undefined,
  fallbackHex: string,
): string => {
  if (token === undefined || token === "") {
    return fallbackHex;
  }
  if (typeof token === "string") {
    return token;
  }
  return fallbackHex;
};

export interface AssetChartProps {
  asset: Asset;
  timeframe: AssetTimeframe;
  onTimeframeChange: (next: AssetTimeframe) => void;
}

export const AssetChart = ({
  asset,
  timeframe,
  onTimeframeChange,
}: AssetChartProps): React.ReactElement => {
  const [chartBounds, setChartBounds] = useState<ChartBounds | null>(null);

  const chart3Token = useCSSVariable("--color-chart-3");

  const series = useMemo<readonly AssetSeriesPoint[]>(() => {
    return asset.seriesByTimeframe[timeframe];
  }, [asset, timeframe]);

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { value: series.length > 0 ? series[0].value : 0 },
  });

  // `Intl.NumberFormat` cannot run inside a worklet, so the USD label is
  // assembled manually with magnitude-based precision.
  const valueLabel = useDerivedValue<string>(() => {
    "worklet";
    const price = state.y.value.value.value;
    const precision = Math.abs(price) >= 1 ? 2 : 4;
    const fixed = price.toFixed(precision);
    const [intPart, fracPart] = fixed.split(".");
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return ["$", grouped, ".", fracPart].join("");
  });

  const handleTimeframeChange = (next: string): void => {
    if (isAssetTimeframe(next)) {
      fireHaptic();
      onTimeframeChange(next);
    }
  };

  return (
    <View className="gap-3">
      <ChartCrosshair.Anchor
        chartBounds={chartBounds}
        isActive={state.isActive}
        x={state.x.position}
      >
        <AreaChart
          data={[...series]}
          xKey="x"
          yKeys={["value"]}
          chartPressState={state}
          onChartBoundsChange={setChartBounds}
          // `font: null` overrides the themed default font that
          // `BaseCartesianChart` would otherwise inject, hiding tick labels.
          xAxis={{ font: null }}
          yAxis={[{ font: null }]}
          wrapperClassName="h-56 w-full"
        >
          {({ points, chartBounds }) => {
            const strokeColor = resolveGradientBaseColor(chart3Token, "#6366f1");
            const topColor = colorKit.setAlpha(strokeColor, 0.7).hex();
            const bottomColor = colorKit.setAlpha(strokeColor, 0.02).hex();

            return (
              <>
                <AreaChart.Area
                  points={points.value}
                  y0={chartBounds.bottom}
                  curveType="natural"
                  animate={{ type: "spring" }}
                >
                  <LinearGradient
                    colors={[topColor, bottomColor]}
                    end={vec(0, chartBounds.bottom)}
                    start={vec(0, chartBounds.top)}
                  />
                </AreaChart.Area>
                <LineChart.Line
                  points={points.value}
                  curveType="natural"
                  animate={{ type: "spring" }}
                />
                {isActive ? (
                  <>
                    <ChartCrosshair
                      variant="dashed"
                      x={state.x.position}
                      top={chartBounds.top}
                      bottom={chartBounds.bottom}
                    />
                    <ChartIndicator x={state.x.position} y={state.y.value.position} />
                  </>
                ) : null}
              </>
            );
          }}
        </AreaChart>
        <ChartCrosshair.Value value={valueLabel} placement="top" variant="default">
          <ChartCrosshair.ValueLabel />
        </ChartCrosshair.Value>
      </ChartCrosshair.Anchor>

      <View className="items-center px-5">
        <Segment value={timeframe} onValueChange={handleTimeframeChange} size="sm">
          <Segment.Group>
            <Segment.Indicator />
            {TIMEFRAMES.map((tf) => (
              <Segment.Item key={tf} value={tf}>
                <Segment.Label>{tf}</Segment.Label>
              </Segment.Item>
            ))}
          </Segment.Group>
        </Segment>
      </View>
    </View>
  );
};
