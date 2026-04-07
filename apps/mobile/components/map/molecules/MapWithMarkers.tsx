// molecules/MapWithMarkers.tsx
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';

import MarkerComponent from '~/components/map/atom/Marker';
import { MAP_STYLE_URL } from '~/constants/Map';
import type { Region } from '~/lib/utils/mapUtils';
import { ListingRecord } from '~/lib/types/models';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

export type MapWithMarkersRef = {
  flyTo: (center: [number, number], zoomLevel: number, duration?: number) => void;
  animateToRegion: (region: Region, duration?: number) => void;
};

interface MapWithMarkersProps {
  region: Region;
  listings: ListingRecord[] | { lat: number; long: number; id: string }[];
  onMarkerPress: (store: any) => void;
  onRegionChangeComplete: (region: Region) => void;
  selectedListingId: string | null;
}

const MapWithMarkers = forwardRef<MapWithMarkersRef, MapWithMarkersProps>(
  ({ region, listings, onMarkerPress, onRegionChangeComplete, selectedListingId }, ref) => {
    const cameraRef = useRef<any>(null);
    const zoomLevel = Math.log2(360 / region.latitudeDelta);
    const center: [number, number] = [region.longitude, region.latitude];

    useImperativeHandle(ref, () => ({
      flyTo: (c: [number, number], z: number, duration = 500) => {
        cameraRef.current?.setCamera({
          centerCoordinate: c,
          zoomLevel: z,
          animationDuration: duration,
        });
      },
      animateToRegion: (r: Region, duration = 500) => {
        const z = Math.log2(360 / r.latitudeDelta);
        const c: [number, number] = [r.longitude, r.latitude];
        cameraRef.current?.setCamera({
          centerCoordinate: c,
          zoomLevel: z,
          animationDuration: duration,
        });
      },
    }));

    const handleCameraChanged = (state: { properties: { center: number[]; zoom: number } }) => {
      const { center: c, zoom: z } = state.properties;
      const latitudeDelta = 360 / Math.pow(2, z);
      const longitudeDelta = latitudeDelta * 1.5;
      onRegionChangeComplete({
        latitude: c[1],
        longitude: c[0],
        latitudeDelta,
        longitudeDelta,
      });
    };

    return (
      <MapView
        style={StyleSheet.absoluteFill}
        styleURL={MAP_STYLE_URL}
        onCameraChanged={handleCameraChanged}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: center, zoomLevel }}
          centerCoordinate={center}
          zoomLevel={zoomLevel}
        />
        <Mapbox.UserLocation visible={true} />
        {listings.map((listing) => {
          const lat = (listing as any).lat ?? (listing as ListingRecord).location?.coordinates?.[1];
          const lon = (listing as any).long ?? (listing as ListingRecord).location?.coordinates?.[0];
          if (!lat || !lon) return null;
          return (
            <PointAnnotation
              key={listing.id}
              id={`marker-${listing.id}`}
              coordinate={[lon, lat]}
              onSelected={() => onMarkerPress(listing)}>
              <MarkerComponent
                store={listing}
                selected={listing.id === selectedListingId}
                onPress={() => onMarkerPress(listing)}
              />
            </PointAnnotation>
          );
        })}
      </MapView>
    );
  }
);

export default MapWithMarkers;
