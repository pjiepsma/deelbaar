import { Dimensions } from 'react-native';

export const PLACE_DETAIL_BG = '#F2EDE8';
export const PLACE_DETAIL_SURFACE = '#EAE4DC';
export const PLACE_DETAIL_TEXT_PRIMARY = '#1A1A1A';
export const PLACE_DETAIL_TEXT_MUTED = '#8A8070';
export const PLACE_DETAIL_ACCENT = '#E07B2A';
export const PLACE_DETAIL_TAG_BG = '#2C2C2C';
export const PLACE_DETAIL_TAG_TEXT = '#FFFFFF';
export const PLACE_DETAIL_LINK = '#C4622A';
export const PLACE_DETAIL_CTA_SECONDARY = '#D9CEBC';
export const PLACE_DETAIL_HERO_PLACEHOLDER = '#4a4540';

export const PLACE_DETAIL_HERO_HEIGHT_RATIO = 0.36;
export const PLACE_DETAIL_HERO_OVERLAY_Z_INDEX = 30;
export const PLACE_DETAIL_PANEL_RADIUS = 24;
export const PLACE_DETAIL_HORIZONTAL_PADDING = 20;
export const PLACE_DETAIL_SECTION_GAP = 16;

export const PLACE_DETAIL_HERO_CHROME_SIZE = 40;
export const PLACE_DETAIL_MAP_THUMB_SIZE = 80;
export const PLACE_DETAIL_TOGGLE_PILL_HEIGHT = 32;
export const PLACE_DETAIL_HERO_DISABLED_OPACITY = 0.45;
export const PLACE_DETAIL_HERO_CHROME_GAP = 8;

export function placeDetailHeroHeight(): number {
  return Math.round(Dimensions.get('window').height * PLACE_DETAIL_HERO_HEIGHT_RATIO);
}

export function placeDetailHeroChromeBottom(): number {
  // Controls sit just above the beige curve: R (overlap) + gap
  return PLACE_DETAIL_PANEL_RADIUS + PLACE_DETAIL_HERO_CHROME_GAP;
}

export function placeDetailSheetOverlap(): number {
  return PLACE_DETAIL_PANEL_RADIUS;
}
