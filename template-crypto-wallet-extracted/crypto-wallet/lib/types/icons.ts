export const DEFAULT_ICON_SIZE = 20;

// Multi-color marks are authored on a 24x24 disc grid, so 24 keeps the
// aspect ratio intact at the typical chip sizes (28-44 px) used in the app.
export const DEFAULT_MULTI_COLOR_ICON_SIZE = 24;

/**
 * Public props for the theme-aware `SingleColorIcon` dispatcher.
 *
 * `color` falls back to the heroui-native theme `foreground` value when
 * omitted. `colorClassName` is consumed by `withUniwind` and resolved to the
 * `color` prop via the `accentColor` style property (e.g. `"accent-blue-500"`).
 */
export interface IconProps {
  size?: number;
  color?: string;
  colorClassName?: string;
}

// `size` and `color` are always pre-resolved by the dispatcher; primitives
// stay pure (no theme hooks, no `withUniwind` wrapping, no defaulting).
export interface SingleColorIconSvgProps {
  size: number;
  color: string;
}

// Multi-color icons have hardcoded palettes — neither `color` nor className
// tinting applies. Layout is the caller's responsibility.
export interface MultiColorIconBaseProps {
  size?: number;
}

export interface MultiColorIconSvgProps {
  size: number;
}
