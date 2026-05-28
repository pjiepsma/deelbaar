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

const MAP_FILTER_ALL_CHIP_COLORS: Record<'selected' | 'unselected', MapPlaceFilterChipColors> = {
  selected: {
    backgroundColor: '#4A6054',
    labelColor: '#FFFFFF',
  },
  unselected: {
    backgroundColor: '#EBE6E0',
    labelColor: '#5C5346',
  },
};

export const MAP_PLACE_CATEGORY_COLORS: Record<MapPlaceCollection, MapPlaceCategoryColors> = {
  kiosks: {
    pin: '#E07B2A',
    pinFocused: '#B85A12',
    badgeBackground: '#FCE8D6',
    badgeForeground: '#8B4512',
  },
  markets: {
    pin: '#3B9362',
    pinFocused: '#2A7349',
    badgeBackground: '#DDF3E4',
    badgeForeground: '#1F5C38',
  },
  taps: {
    pin: '#3B82F6',
    pinFocused: '#1D4ED8',
    badgeBackground: '#DBEAFE',
    badgeForeground: '#1E40AF',
  },
};

export function mapPlaceCategoryColors(collection: MapPlaceCollection): MapPlaceCategoryColors {
  return MAP_PLACE_CATEGORY_COLORS[collection];
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
