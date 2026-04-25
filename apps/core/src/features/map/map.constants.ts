import type { Listing as PayloadListing } from '../../../lib/types/payload-generated';

export const MAP_CENTER: [number, number] = [4.9041, 52.3676];
export const MAP_DEFAULT_ZOOM = 12;

export const MAP_CATEGORY_FILTERS: ReadonlyArray<{
  value: 'All' | PayloadListing['category'];
  label: string;
}> = [
  { value: 'All', label: 'All' },
  { value: 'book', label: 'Books' },
  { value: 'food', label: 'Food' },
  { value: 'hygiene', label: 'Hygiene' },
  { value: 'community', label: 'Community' },
  { value: 'farm', label: 'Farm' },
  { value: 'other', label: 'Other' },
];

export const CARD_WIDTH = 340;
export const CARD_IMAGE_HEIGHT = 190;
export const CARD_OVERLAY_BUTTON_SIZE = 36;
export const CARD_CORNER_RADIUS = 18;
export const MAP_OVERLAY_HORIZONTAL_PADDING = 16;
export const MAP_OVERLAY_TOP_GAP = 8;
export const MAP_OVERLAY_BOTTOM_GAP = 8;
export const CARD_SCROLL_GAP = 12;
export const CATEGORY_SCROLL_GAP = 8;
export const RATING_DOT_COUNT = 5;
export const RATING_DOT_SIZE = 10;
