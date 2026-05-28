import Mapbox from '@rnmapbox/maps';
import { memo } from 'react';
import { View } from 'react-native';

import { mapPlaceCategoryColors } from '../../lib/mapPlaces/mapPlaceCategoryColors';
import {
  MAP_LISTING_PIN_BORDER_WIDTH,
  MAP_LISTING_PIN_FOCUSED_SIZE,
  MAP_LISTING_PIN_SIZE,
} from './map.constants';
import { listingMarkerKey } from './mapViewport';
import type { MapListingCard } from './map.types';

type Props = {
  listings: MapListingCard[];
  focusedListingKey: string | null;
  onSelectListing: (listing: MapListingCard) => void;
};

function MapListingMarkersComponent({ listings, focusedListingKey, onSelectListing }: Props) {
  return (
    <>
      {listings.map((listing) => {
        if (!listing.lngLat || listing.id === undefined) {
          return null;
        }

        const markerKey = listingMarkerKey(listing) ?? String(listing.id);
        const focused = markerKey === focusedListingKey;
        const pinSize = focused ? MAP_LISTING_PIN_FOCUSED_SIZE : MAP_LISTING_PIN_SIZE;
        const colors = mapPlaceCategoryColors(listing.mapPlaceCollection);

        return (
          <Mapbox.PointAnnotation
            key={markerKey}
            id={markerKey}
            coordinate={listing.lngLat}
            onSelected={() => onSelectListing(listing)}
          >
            <View
              style={{
                width: pinSize,
                height: pinSize,
                borderRadius: pinSize / 2,
                backgroundColor: focused ? colors.pinFocused : colors.pin,
                borderWidth: MAP_LISTING_PIN_BORDER_WIDTH,
                borderColor: '#fff',
              }}
            />
          </Mapbox.PointAnnotation>
        );
      })}
    </>
  );
}

export const MapListingMarkers = memo(MapListingMarkersComponent);
