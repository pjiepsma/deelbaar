import React, { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Mapbox, { Camera, CircleLayer, MapView, ShapeSource, SymbolLayer } from '@rnmapbox/maps';

import type { Region } from '~/lib/utils/mapUtils';
import type { ListingRecord } from '~/lib/types/models';
import { CATEGORY_COLORS_MAP } from '~/lib/utils/categoryHelpers';
import { mapStyleUrlForResolvedTheme } from '~/constants/Map';
import { useThemePreference } from '~/lib/providers/ThemePreferenceProvider';

// Set Mapbox token (must be called before any Mapbox component renders)
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

export interface MapViewWithMarkersProps {
  mapRef: RefObject<{
    flyTo: (center: [number, number], zoomLevel: number, animationDuration?: number) => void;
  } | null>;
  region: Region;
  markers: ListingRecord[];
  selectedId: string | null;
  onRegionChangeComplete: (region: Region) => void;
  onMarkerPress: (listing: ListingRecord) => void;
}

const INITIAL_ZOOM = 12;
const DEFAULT_COLOR = CATEGORY_COLORS_MAP.other;

/**
 * Map view with ShapeSource + CircleLayer + SymbolLayer (native Mapbox clustering)
 */
export const MapViewWithMarkers = React.memo<MapViewWithMarkersProps>(
  ({ mapRef, region, markers, selectedId, onRegionChangeComplete, onMarkerPress }) => {
    const { resolvedTheme } = useThemePreference();
    const mapStyleUrl = useMemo(
      () => mapStyleUrlForResolvedTheme(resolvedTheme),
      [resolvedTheme],
    );
    const shapeSourceRef = useRef<ShapeSource>(null);

    const center = useMemo<[number, number]>(
      () => [region.longitude, region.latitude],
      [region.longitude, region.latitude]
    );

    // GeoJSON FeatureCollection for ShapeSource
    const geoJsonFeatureCollection = useMemo(() => {
      const limitedMarkers = markers.slice(0, 1000);
      const features = limitedMarkers
        .map((listing) => {
          const coords = listing.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          return {
            type: 'Feature' as const,
            id: listing.id,
            properties: {
              id: listing.id,
              category: listing.category || 'other',
              listing,
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [coords[0], coords[1]] as [number, number],
            },
          };
        })
        .filter((f): f is NonNullable<typeof f> => f !== null);
      return { type: 'FeatureCollection' as const, features };
    }, [markers]);

    const mapDimensions = useMemo(
      () => ({
        width: require('react-native').Dimensions.get('window').width,
        height: require('react-native').Dimensions.get('window').height,
      }),
      []
    );

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleCameraChanged = useCallback(
      (state: { properties: { center: number[]; zoom: number } }) => {
        const { center: c, zoom: z } = state.properties;
        const latitudeDelta = 360 / Math.pow(2, z);
        const longitudeDelta = latitudeDelta * (mapDimensions.width / mapDimensions.height);
        const nextRegion: Region = {
          latitude: c[1],
          longitude: c[0],
          latitudeDelta,
          longitudeDelta,
        };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          onRegionChangeComplete(nextRegion);
        }, 400);
      },
      [onRegionChangeComplete, mapDimensions]
    );

    useEffect(
      () => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      },
      []
    );

    const handleShapePress = useCallback(
      async (event: { features: GeoJSON.Feature[] }) => {
        const feature = event.features[0];
        if (!feature || !mapRef?.current || !shapeSourceRef.current) return;

        const props = feature.properties as Record<string, unknown>;
        const pointCount = props?.point_count as number | undefined;
        const isCluster = typeof pointCount === 'number' && pointCount > 0;

        if (isCluster) {
          try {
            const zoom = await shapeSourceRef.current.getClusterExpansionZoom(feature);
            const coords = (feature.geometry as GeoJSON.Point).coordinates;
            const centerCoord: [number, number] = [coords[0], coords[1]];
            mapRef.current.flyTo(centerCoord, Math.min(zoom, 20), 300);
          } catch {
            // ignore
          }
        } else {
          const listing = props?.listing as ListingRecord | undefined;
          if (listing) onMarkerPress(listing);
        }
      },
      [mapRef, onMarkerPress]
    );

    // Mapbox expression for category-based circle color (single points)
    const singlePointCircleColor = useMemo(
      () =>
        [
          'match',
          ['get', 'category'],
          ...Object.entries(CATEGORY_COLORS_MAP).flat(),
          DEFAULT_COLOR,
        ] as const,
      []
    );

    // Cluster circle styles (aligned with primary emerald)
    const clusterCircleColor = [
      'step',
      ['get', 'point_count'],
      '#059669', // emerald-600
      10,
      '#047857', // emerald-700
      100,
      '#065f46', // emerald-800
    ] as const;

    return (
      <MapView
        style={StyleSheet.absoluteFill}
        styleURL={mapStyleUrl}
        onCameraChanged={handleCameraChanged}
        compassEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={true}>
        <Camera
          ref={(r) => {
            if (!mapRef) return;
            if (r) {
              (
                mapRef as React.MutableRefObject<{
                  flyTo: (c: [number, number], z: number, d?: number) => void;
                } | null>
              ).current = {
                flyTo: (c, z, duration = 500) => {
                  r?.setCamera({
                    centerCoordinate: c,
                    zoomLevel: z,
                    animationDuration: duration,
                  });
                },
              };
            } else {
              (
                mapRef as React.MutableRefObject<{
                  flyTo: (c: [number, number], z: number, d?: number) => void;
                } | null>
              ).current = null;
            }
          }}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: INITIAL_ZOOM,
          }}
        />

        <Mapbox.UserLocation visible />

        {geoJsonFeatureCollection.features.length > 0 && (
          <ShapeSource
            ref={shapeSourceRef}
            id="listings-source"
            shape={geoJsonFeatureCollection}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={16}
            onPress={handleShapePress}
            hitbox={{ width: 44, height: 44 }}>
            <CircleLayer
              id="clusters"
              filter={['has', 'point_count']}
              style={{
                circleColor: clusterCircleColor,
                circleRadius: ['step', ['get', 'point_count'], 16, 10, 20, 100, 24],
                circleStrokeWidth: 2.5,
                circleStrokeColor: '#FFFFFF',
                circlePitchAlignment: 'map',
              }}
            />
            <SymbolLayer
              id="cluster-count"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count'],
                textSize: 12,
                textColor: '#FFFFFF',
                textPitchAlignment: 'map',
              }}
            />
            <CircleLayer
              id="single-points"
              filter={['!', ['has', 'point_count']]}
              style={{
                circleColor: singlePointCircleColor,
                circleRadius: 14,
                circleStrokeWidth: 2.5,
                circleStrokeColor: '#FFFFFF',
                circlePitchAlignment: 'map',
              }}
            />
          </ShapeSource>
        )}
      </MapView>
    );
  }
);
