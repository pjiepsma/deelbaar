import {
  MAP_PLACE_FILTER_VALUES,
  type MapPlaceCollection,
} from '../../lib/mapPlaces/mapPlaceTaxonomy';

export const LISTING_COLLECTION_ROW = MAP_PLACE_FILTER_VALUES.filter(
  (value): value is MapPlaceCollection => value !== 'All',
);

export function kindFieldsForSave(
  collection: MapPlaceCollection,
  subtype: string,
): {
  kioskSubtype: string | null;
  marketSubtype: string | null;
  tapSubtype: string | null;
} {
  switch (collection) {
    case 'kiosks':
      return {
        kioskSubtype: subtype,
        marketSubtype: null,
        tapSubtype: null,
      };
    case 'markets':
      return {
        kioskSubtype: null,
        marketSubtype: subtype,
        tapSubtype: null,
      };
    case 'taps':
      return {
        kioskSubtype: null,
        marketSubtype: null,
        tapSubtype: subtype,
      };
    default: {
      const exhaustiveCollection: never = collection;
      throw new Error(`Unhandled collection: ${String(exhaustiveCollection)}`);
    }
  }
}

export function isMapPlaceCollection(value: string): value is MapPlaceCollection {
  return value === 'kiosks' || value === 'markets' || value === 'taps';
}
