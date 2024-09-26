// molecules/MapWithMarkers.tsx
import React from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Region } from 'react-native-maps/lib/sharedTypes';

import MarkerComponent from '~/components/map/atom/Marker';

interface MapWithMarkersProps {
  region: Region;
  listings: { lat: number; long: number; id: string }[];
  onMarkerPress: (store: any) => void;
  onRegionChangeComplete: (region: Region) => void;
}

const MapWithMarkers: React.FC<MapWithMarkersProps> = ({
  region,
  listings,
  onMarkerPress,
  onRegionChangeComplete,
}) => (
  <MapView
    minZoomLevel={12}
    style={{ flex: 1 }}
    onRegionChangeComplete={onRegionChangeComplete}
    initialRegion={region}
    provider={PROVIDER_GOOGLE}
    showsUserLocation
    showsMyLocationButton={false}>
    {listings.map((store) => (
      <MarkerComponent key={store.id} store={store} onPress={() => onMarkerPress(store)} />
    ))}
  </MapView>
);

export default MapWithMarkers;
