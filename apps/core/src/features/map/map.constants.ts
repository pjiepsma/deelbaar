export const MAP_CENTER: [number, number] = [4.9041, 52.3676];
export const MAP_DEFAULT_ZOOM = 12;

/** Mapbox GL style URLs (basemap); paired with app light/dark. */
export const MAPBOX_STYLE_STREETS = 'mapbox://styles/mapbox/streets-v12';
export const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

/** How long to wait after the last camera event before updating shared discovery coordinates. */
export const MAP_CAMERA_DEBOUNCE_MS = 450;

/** Used by Saved tab vertical cards. */
export const CARD_IMAGE_HEIGHT = 190;

export const MAP_OVERLAY_HORIZONTAL_PADDING = 16;
export const MAP_OVERLAY_TOP_GAP = 8;

/** Komoot-style horizontal listing carousel at the bottom of the map. */
export const MAP_LISTING_CAROUSEL_BOTTOM_PADDING = 12;
export const MAP_LISTING_CARD_GAP = 10;
export const MAP_LISTING_IMAGE_SIZE = 92;
export const MAP_LISTING_CARD_HEIGHT = 104;
export const MAP_LISTING_CARD_PEEK = 28;
export const MAP_LISTING_CARD_RADIUS = 14;
export const MAP_LISTING_CARD_INNER_GAP = 10;
export const MAP_LISTING_HEART_SIZE = 32;
export const MAP_LISTING_THUMB_OVERLAY_INSET = 6;

export function mapListingCarouselCardWidth(screenWidth: number): number {
  return screenWidth - MAP_OVERLAY_HORIZONTAL_PADDING * 2 - MAP_LISTING_CARD_PEEK;
}

/** Coachmark bubble sits above the horizontal listing carousel. */
export const MAP_COACHMARK_OVERLAY_EXTRA_GAP =
  MAP_LISTING_CARD_HEIGHT + MAP_LISTING_CAROUSEL_BOTTOM_PADDING + 16;

export const CATEGORY_SCROLL_GAP = 8;
