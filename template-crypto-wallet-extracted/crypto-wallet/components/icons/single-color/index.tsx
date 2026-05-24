import { useThemeColor } from "heroui-native";
import React from "react";
import { withUniwind } from "uniwind";

import { DEFAULT_ICON_SIZE, type IconProps, type SingleColorIconSvgProps } from "@/lib/types/icons";

import { ArrowDownSvg } from "./arrow-down";
import { ArrowDownLeftSvg } from "./arrow-down-left";
import { ArrowLeftSvg } from "./arrow-left";
import { ArrowUpRightSvg } from "./arrow-up-right";
import { ArrowsLeftRightSvg } from "./arrows-left-right";
import { ArrowsUpDownSvg } from "./arrows-up-down";
import { ChartColumnSvg } from "./chart-column";
import { CheckSvg } from "./check";
import { ChevronRightSvg } from "./chevron-right";
import { ClockSvg } from "./clock";
import { ClockFillSvg } from "./clock-fill";
import { CloseSvg } from "./close";
import { CopySvg } from "./copy";
import { CreditCardSvg } from "./credit-card";
import { DisplaySvg } from "./display";
import { GearSvg } from "./gear";
import { HomeSvg } from "./home";
import { HomeFillSvg } from "./home-fill";
import { InboxSvg } from "./inbox";
import { LinkSvg } from "./link";
import { MoonSvg } from "./moon";
import { QrCodeSvg } from "./qr-code";
import { RefreshSvg } from "./refresh";
import { SearchSvg } from "./search";
import { SearchFillSvg } from "./search-fill";
import { SunSvg } from "./sun";
import { TrendDownSvg } from "./trend-down";
import { TrendUpSvg } from "./trend-up";
import { WalletSvg } from "./wallet";

// `satisfies` (without an explicit annotation) keeps the keys as a literal
// union — `SingleColorIconName` below stays exhaustive over the registry.
const SINGLE_COLOR_ICONS = {
  "arrow-down": ArrowDownSvg,
  "arrow-down-left": ArrowDownLeftSvg,
  "arrow-left": ArrowLeftSvg,
  "arrow-up-right": ArrowUpRightSvg,
  "arrows-left-right": ArrowsLeftRightSvg,
  "arrows-up-down": ArrowsUpDownSvg,
  "chart-column": ChartColumnSvg,
  "check": CheckSvg,
  "chevron-right": ChevronRightSvg,
  "clock": ClockSvg,
  "clock-fill": ClockFillSvg,
  "close": CloseSvg,
  "copy": CopySvg,
  "credit-card": CreditCardSvg,
  "display": DisplaySvg,
  "gear": GearSvg,
  "home": HomeSvg,
  "home-fill": HomeFillSvg,
  "inbox": InboxSvg,
  "link": LinkSvg,
  "moon": MoonSvg,
  "qr-code": QrCodeSvg,
  "refresh": RefreshSvg,
  "search": SearchSvg,
  "search-fill": SearchFillSvg,
  "sun": SunSvg,
  "trend-down": TrendDownSvg,
  "trend-up": TrendUpSvg,
  "wallet": WalletSvg,
} as const satisfies Record<string, React.FC<SingleColorIconSvgProps>>;

export type SingleColorIconName = keyof typeof SINGLE_COLOR_ICONS;

interface SingleColorIconProps extends IconProps {
  name: SingleColorIconName;
}

const SingleColorIconComponent: React.FC<SingleColorIconProps> = ({
  name,
  size = DEFAULT_ICON_SIZE,
  color,
}) => {
  const foregroundColor = useThemeColor("foreground");
  const SvgComponent = SINGLE_COLOR_ICONS[name];
  return <SvgComponent size={size} color={color ?? foregroundColor} />;
};

/**
 * Theme-aware icon dispatcher.
 *
 * ```tsx
 * <SingleColorIcon name="home" size={24} />                       // theme foreground
 * <SingleColorIcon name="check" color="#10b981" />                // explicit override
 * <SingleColorIcon name="copy" colorClassName="accent-blue-500" /> // via withUniwind
 * ```
 */
export const SingleColorIcon = withUniwind(SingleColorIconComponent, {
  color: {
    fromClassName: "colorClassName",
    styleProperty: "accentColor",
  },
});
