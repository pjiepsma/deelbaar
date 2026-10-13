/** Apeldoorn city center — matches CMS seed listings. */
export const MAP_CENTER: [number, number] = [5.9688, 52.2108];
export const MAP_DEFAULT_ZOOM = 12;

/** Listing pin size on map tab. */
export const MAP_LISTING_PIN_SIZE = 14;
export const MAP_LISTING_PIN_BORDER_WIDTH = 2;
export const MAP_LISTING_PIN_FOCUSED_SIZE = 18;

/** Carousel focus → map camera: nudge strength when pin already in view (0–1). */
export const MAP_CAROUSEL_CAMERA_NUDGE = 0.25;
export const MAP_CAROUSEL_CAMERA_ANIMATION_MS = 400;
/** Fraction of visible radius treated as “in view” for carousel camera nudge vs fly-to. */
export const MAP_CAROUSEL_IN_VIEW_MARGIN = 0.8;
/** Carousel lists places inside the map view plus a thin ring just outside (1 = edge). */
export const MAP_CAROUSEL_VIEWPORT_MARGIN = 1.15;
/** Delay camera follow until carousel snap settles after a swipe. */
export const MAP_CAROUSEL_SNAP_CAMERA_DEBOUNCE_MS = 180;

/** Mapbox GL style URLs (basemap); paired with app light/dark. */
export const MAPBOX_STYLE_STREETS = 'mapbox://styles/mapbox/streets-v12';
export const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

/** How long to wait after the last camera event before updating shared discovery coordinates. */
export const MAP_CAMERA_DEBOUNCE_MS = 450;

/** Zoom when flying to a geocoded city / address from the search bar. */
export const MAP_AREA_SEARCH_ZOOM = MAP_DEFAULT_ZOOM;
export const MAP_MIN_ZOOM = 8;
export const MAP_MAX_ZOOM = 18;

/** 3×3 prefetch buffer: fetch radius = visible radius × this multiplier. */
export const MAP_FETCH_ZONE_TILE_MULTIPLIER = 3;
/** Refetch when map center moves beyond this fraction of fetch radius from anchor. */
export const MAP_FETCH_REFETCH_TILE_FRACTION = 1 / 3;
/** Max listings per viewport fetch. */
export const MAP_FETCH_LISTING_LIMIT = 200;
/** Zoom ref change beyond this fraction triggers refetch. */
export const MAP_FETCH_RADIUS_CHANGE_THRESHOLD = 0.25;
/** Pin layer uses a slightly wider viewport than the carousel. */
export const MAP_MARKER_VIEWPORT_MARGIN = 1.1;
/** Hard cap on PointAnnotation count in viewport. */
export const MAP_MAX_RENDERED_PINS = 80;
/** Throttle zoom-driven React state while panning. */
export const MAP_ZOOM_STATE_THROTTLE_MS = 150;

/** Debounce before prefetching place detail when carousel/pin focus changes. */
export const MAP_FOCUS_PREFETCH_DEBOUNCE_MS = 300;

/** Used by Saved tab vertical cards. */
export const CARD_IMAGE_HEIGHT = 190;

export const MAP_OVERLAY_HORIZONTAL_PADDING = 16;
export const MAP_OVERLAY_TOP_GAP = 8;

/** Gap between carousel and tab chrome (floating pill or native tab top). */
export const MAP_LISTING_CAROUSEL_BOTTOM_PADDING = 12;
export const MAP_LISTING_CARD_GAP = 10;
export const MAP_LISTING_IMAGE_SIZE = 92;
export const MAP_LISTING_CARD_HEIGHT = 104;
export const MAP_LISTING_CARD_PEEK = 28;
export const MAP_LISTING_CARD_RADIUS = 14;
export const MAP_LISTING_CARD_INNER_GAP = 10;
export const MAP_LISTING_HEART_SIZE = 32;
export const MAP_LISTING_THUMB_OVERLAY_INSET = 6;
export const MAP_MY_LOCATION_ABOVE_CAROUSEL_GAP = 12;
export const MAP_COACHMARK_ABOVE_CAROUSEL_GAP = 16;

export function mapListingCarouselCardWidth(screenWidth: number): number {
  return screenWidth - MAP_OVERLAY_HORIZONTAL_PADDING * 2 - MAP_LISTING_CARD_PEEK;
}

/** Carousel `bottom` — `tabBarOverlayClearance` is 0 on iOS, pill stack on Android. */
export function mapListingCarouselBottom(tabBarOverlayClearance: number): number {
  return tabBarOverlayClearance + MAP_LISTING_CAROUSEL_BOTTOM_PADDING;
}

/** My-location control sits above the carousel, right inset. */
export function mapMyLocationBottom(tabBarOverlayClearance: number): number {
  return (
    mapListingCarouselBottom(tabBarOverlayClearance) +
    MAP_LISTING_CARD_HEIGHT +
    MAP_MY_LOCATION_ABOVE_CAROUSEL_GAP
  );
}

/** Coachmark bubble sits above the horizontal listing carousel. */
export function mapCoachmarkBottom(tabBarOverlayClearance: number): number {
  return (
    mapListingCarouselBottom(tabBarOverlayClearance) +
    MAP_LISTING_CARD_HEIGHT +
    MAP_COACHMARK_ABOVE_CAROUSEL_GAP
  );
}

export const CATEGORY_SCROLL_GAP = 8;
