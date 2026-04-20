// Mapbox basemaps — must work with ShapeSource / CircleLayer (use v11+ official styles).
// OSM Bright had marker visibility issues with styleJSON.
//
// Light: streets (2D, good contrast for category markers).
// Dark: official dark basemap; switch with `mapStyleUrlForResolvedTheme` from app theme.

export const MAP_STYLE_URL_LIGHT = 'mapbox://styles/mapbox/streets-v12';
export const MAP_STYLE_URL_DARK = 'mapbox://styles/mapbox/dark-v11';

/** @deprecated Use `MAP_STYLE_URL_LIGHT` or `mapStyleUrlForResolvedTheme`. */
export const MAP_STYLE_URL = MAP_STYLE_URL_LIGHT;

export function mapStyleUrlForResolvedTheme(resolved: 'light' | 'dark'): string {
  return resolved === 'dark' ? MAP_STYLE_URL_DARK : MAP_STYLE_URL_LIGHT;
}
