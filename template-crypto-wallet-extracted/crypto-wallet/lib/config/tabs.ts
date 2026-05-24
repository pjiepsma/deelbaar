import type { SingleColorIconName } from "@/components/icons/single-color";

// `name` doubles as the Expo Router route segment under `app/(tabs)/`.
// `"index"` is the home tab.
export type TabRouteName = "index" | "search" | "activity";

/**
 * Restricting to the specific names actually rendered by the tab bar keeps
 * the type narrow and makes invalid keys impossible at the source.
 */
export type TabIconName = Extract<SingleColorIconName, "home" | "search" | "clock">;

/**
 * Focused-state counterparts for `TabIconName`. The `${T}-fill` template
 * locks each entry to the matching `-fill` primitive registered under the
 * same base name, so a typo or a missing primitive surfaces here as a TS
 * error rather than a silent runtime fallback.
 */
export type TabIconFocusedName = Extract<SingleColorIconName, `${TabIconName}-fill`>;

export interface TabConfig {
  name: TabRouteName;
  label: string;
  iconName: TabIconName;
  iconFocusedName: TabIconFocusedName;
}

export const TABS: readonly TabConfig[] = [
  {
    name: "index",
    label: "Home",
    iconName: "home",
    iconFocusedName: "home-fill",
  },
  {
    name: "search",
    label: "Search",
    iconName: "search",
    iconFocusedName: "search-fill",
  },
  {
    name: "activity",
    label: "Activity",
    iconName: "clock",
    iconFocusedName: "clock-fill",
  },
];
