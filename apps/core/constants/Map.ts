// Mapbox basemaps — must work with ShapeSource / CircleLayer (use v11+ official styles).
// OSM Bright had marker visibility issues with styleJSON.
//
// Light: streets (2D, good contrast for category markers).
// Dark: official dark basemap; switch with `mapStyleUrlForResolvedTheme` from app theme.

export const MAP_STYLE_URL_LIGHT = 'mapbox://styles/mapbox/streets-v12';
// Keep dark mode readable; full dark-v11 can appear almost black on some devices.
export const MAP_STYLE_URL_DARK = 'mapbox://styles/mapbox/navigation-night-v1';

/** @deprecated Use `MAP_STYLE_URL_LIGHT` or `mapStyleUrlForResolvedTheme`. */
export const MAP_STYLE_URL = MAP_STYLE_URL_LIGHT;

export function mapStyleUrlForResolvedTheme(resolved: 'light' | 'dark'): string {
  return resolved === 'dark' ? MAP_STYLE_URL_DARK : MAP_STYLE_URL_LIGHT;
}
