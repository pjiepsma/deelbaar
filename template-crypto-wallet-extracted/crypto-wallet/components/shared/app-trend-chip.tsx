import type {
  TrendArrowIconProps,
  TrendChipIndicatorProps,
  TrendChipRootProps,
  TrendDirection,
} from "heroui-native-pro";
import { TrendChip, useTrendChip } from "heroui-native-pro";
import { Children, type ReactNode } from "react";
import Svg, { Path } from "react-native-svg";
import { withUniwind } from "uniwind";

const DEFAULT_TRIANGLE_SIZE = 16;

const TRIANGLE_UP_PATH =
  "M10.164 2.244c-.962-1.665-3.366-1.665-4.329 0L.918 10.749c-.963 1.666.24 3.751 2.165 3.751h9.834c1.925 0 3.128-2.085 2.164-3.751z";
const TRIANGLE_DOWN_PATH =
  "M10.164 13.756c-.962 1.665-3.366 1.665-4.329 0L.918 5.251C-.045 3.584 1.158 1.5 3.083 1.5h9.834c1.925 0 3.128 2.084 2.164 3.751z";

const TriangleUpBase = ({
  size = DEFAULT_TRIANGLE_SIZE,
  color = "currentColor",
  ...restProps
}: TrendArrowIconProps): React.ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" {...restProps}>
    <Path d={TRIANGLE_UP_PATH} fill={color} />
  </Svg>
);

const TriangleDownBase = ({
  size = DEFAULT_TRIANGLE_SIZE,
  color = "currentColor",
  ...restProps
}: TrendArrowIconProps): React.ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" {...restProps}>
    <Path d={TRIANGLE_DOWN_PATH} fill={color} />
  </Svg>
);

const TriangleRightBase = ({
  size = DEFAULT_TRIANGLE_SIZE,
  color = "currentColor",
  ...restProps
}: TrendArrowIconProps): React.ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" {...restProps}>
    <Path d={TRIANGLE_UP_PATH} fill={color} transform="rotate(90 8 8)" />
  </Svg>
);

const TRIANGLE_UNIWIND_CONFIG = {
  color: { fromClassName: "colorClassName", styleProperty: "accentColor" },
} as const;

const TriangleUpIcon = withUniwind(TriangleUpBase, TRIANGLE_UNIWIND_CONFIG);
const TriangleDownIcon = withUniwind(TriangleDownBase, TRIANGLE_UNIWIND_CONFIG);
const TriangleRightIcon = withUniwind(TriangleRightBase, TRIANGLE_UNIWIND_CONFIG);

const TRIANGLE_FOR_TREND = {
  up: TriangleUpIcon,
  down: TriangleDownIcon,
  neutral: TriangleRightIcon,
} satisfies Record<TrendDirection, unknown>;

const AppTrendChipIndicator = (props: TrendChipIndicatorProps): React.ReactElement => {
  const { children, size = 10, ...restProps } = props;
  const { trend } = useTrendChip();
  const Triangle = TRIANGLE_FOR_TREND[trend];
  return (
    <TrendChip.Indicator {...restProps}>{children ?? <Triangle size={size} />}</TrendChip.Indicator>
  );
};

const stringifyTrendChildren = (children: ReactNode): string | null => {
  const items = Children.toArray(children);
  if (items.length === 0) {
    return null;
  }
  const parts: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      parts.push(item);
      continue;
    }
    if (typeof item === "number") {
      parts.push(item.toString());
      continue;
    }
    return null;
  }
  return parts.join("");
};

const AppTrendChipRoot = (props: TrendChipRootProps): React.ReactElement => {
  const { children, size = "sm", ...restProps } = props;
  const stringified = stringifyTrendChildren(children);
  if (stringified !== null) {
    return (
      <TrendChip size={size} {...restProps}>
        <AppTrendChipIndicator />
        <TrendChip.Value>{stringified}</TrendChip.Value>
      </TrendChip>
    );
  }
  return (
    <TrendChip size={size} {...restProps}>
      {children}
    </TrendChip>
  );
};

export const AppTrendChip = Object.assign(AppTrendChipRoot, {
  Indicator: AppTrendChipIndicator,
  Value: TrendChip.Value,
  Prefix: TrendChip.Prefix,
  Suffix: TrendChip.Suffix,
});
