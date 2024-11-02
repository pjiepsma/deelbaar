// molecules/MapWithMarkers.tsx
import React, { forwardRef } from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Region } from 'react-native-maps/lib/sharedTypes';

import MarkerComponent from '~/components/map/atom/Marker';

interface MapWithMarkersProps {
  region: Region;
  listings: { lat: number; long: number; id: string }[];
  onMarkerPress: (store: any) => void;
  onRegionChangeComplete: (region: Region) => void;
  selectedListingId: string | null; // Add this prop
}

const MapWithMarkers = forwardRef<MapView, MapWithMarkersProps>(
  ({ region, listings, onMarkerPress, onRegionChangeComplete, selectedListingId }, ref) => (
    <MapView
      ref={ref}
      moveOnMarkerPress={false}
      minZoomLevel={12}
      style={{ flex: 1 }}
      onRegionChangeComplete={onRegionChangeComplete}
      initialRegion={region}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton={false}>
      {listings.map((listing) => (
        <MarkerComponent
          key={listing.id}
          store={listing}
          selected={listing.id === selectedListingId}
          onPress={() => onMarkerPress(listing)}
        />
      ))}
    </MapView>
  )
);

export default MapWithMarkers;
