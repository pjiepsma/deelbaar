import { DEELBAAR_MOSS, DEELBAAR_MOSS_SOFT } from '../../branding/colors';
import type { MapPlaceCollection, MapPlaceFilterValue } from './mapPlaceTaxonomy';

export type MapPlaceCategoryColors = {
  pin: string;
  pinFocused: string;
  badgeBackground: string;
  badgeForeground: string;
};

export type MapPlaceFilterChipColors = {
  backgroundColor: string;
  labelColor: string;
};

/** Muted clay / umber — warm but not candy orange. */
const KIOSK_PIN = '#9A6240';
const KIOSK_PIN_FOCUSED = '#7A4A2E';
const KIOSK_BADGE_BG = '#F0E6DC';
const KIOSK_BADGE_FG = '#5C3A24';

/** Slate-teal — water cue without bright UI blue. */
const TAP_PIN = '#3F6F7C';
const TAP_PIN_FOCUSED = '#2E5560';
const TAP_BADGE_BG = '#E4EEF1';
const TAP_BADGE_FG = '#243F48';

const MARKET_PIN_FOCUSED = '#234D2A';
const MARKET_BADGE_FG = '#1A3D22';

const FILTER_ALL_UNSELECTED_BG = '#EBE6E0';
const FILTER_ALL_UNSELECTED_FG = '#5C5346';

const MAP_FILTER_ALL_CHIP_COLORS: Record<'selected' | 'unselected', MapPlaceFilterChipColors> = {
  selected: {
    backgroundColor: DEELBAAR_MOSS,
    labelColor: '#FFFFFF',
  },
  unselected: {
    backgroundColor: FILTER_ALL_UNSELECTED_BG,
    labelColor: FILTER_ALL_UNSELECTED_FG,
  },
};

export const MAP_PLACE_CATEGORY_COLORS: Record<MapPlaceCollection, MapPlaceCategoryColors> = {
  kiosks: {
    pin: KIOSK_PIN,
    pinFocused: KIOSK_PIN_FOCUSED,
    badgeBackground: KIOSK_BADGE_BG,
    badgeForeground: KIOSK_BADGE_FG,
  },
  markets: {
    pin: DEELBAAR_MOSS,
    pinFocused: MARKET_PIN_FOCUSED,
    badgeBackground: DEELBAAR_MOSS_SOFT,
    badgeForeground: MARKET_BADGE_FG,
  },
  taps: {
    pin: TAP_PIN,
    pinFocused: TAP_PIN_FOCUSED,
    badgeBackground: TAP_BADGE_BG,
    badgeForeground: TAP_BADGE_FG,
  },
};

export function mapPlaceCategoryColors(collection: MapPlaceCollection): MapPlaceCategoryColors {
  return MAP_PLACE_CATEGORY_COLORS[collection];
}

/** Filter-row icon tint — same hex as map pin for each place kind. */
export function mapPlaceFilterIconColor(value: MapPlaceFilterValue): string {
  if (value === 'All') {
    return MAP_FILTER_ALL_CHIP_COLORS.selected.backgroundColor;
  }
  return mapPlaceCategoryColors(value).pin;
}

export function mapPlaceFilterChipColors(
  value: MapPlaceFilterValue,
  selected: boolean,
): MapPlaceFilterChipColors {
  if (value === 'All') {
    return selected ? MAP_FILTER_ALL_CHIP_COLORS.selected : MAP_FILTER_ALL_CHIP_COLORS.unselected;
  }

  const colors = mapPlaceCategoryColors(value);
  return selected
    ? { backgroundColor: colors.pin, labelColor: '#FFFFFF' }
    : { backgroundColor: colors.badgeBackground, labelColor: colors.badgeForeground };
}
