import React, { RefObject } from 'react';
import { StyleSheet } from 'react-native';
import { useClusterer, isClusterFeature } from 'react-native-clusterer';
import MapView, { Region } from 'react-native-maps';

import { ClusterMarker } from './ClusterMarker';
import { StableMarker } from './StableMarker';

import { paperMapStyle } from '~/lib/constants/mapStyle';
import { ListingRecord } from '~/lib/types/models';

interface MapViewWithMarkersProps {
  mapRef: RefObject<MapView | null>;
  region: Region;
  markers: ListingRecord[];
  selectedId: string | null;
  onRegionChangeComplete: (region: Region) => void;
  onMarkerPress: (listing: ListingRecord) => void;
  onClusterPress: (
    latitude: number,
    longitude: number,
    clusterId: number,
    supercluster: any
  ) => void;
}

/**
 * Map view component with clustering and marker rendering
 */
export const MapViewWithMarkers = React.memo<MapViewWithMarkersProps>(
  ({
    mapRef,
    region,
    markers,
    selectedId,
    onRegionChangeComplete,
    onMarkerPress,
    onClusterPress,
  }) => {
    // Generate stable cluster key based on rounded coordinates
    const getClusterKey = React.useCallback((latitude: number, longitude: number) => {
      // Round to 4 decimal places (~11 meters precision) for stability
      const roundedLat = Math.round(latitude * 10000) / 10000;
      const roundedLon = Math.round(longitude * 10000) / 10000;
      return `cluster-${roundedLat}-${roundedLon}`;
    }, []);

    // Convert listings to GeoJSON format for clustering
    // Limit to 1000 markers to prevent OOM errors
    const geoJsonPoints = React.useMemo(() => {
      const limitedMarkers = markers.slice(0, 1000);
      return limitedMarkers
        .map((listing) => {
          const coords = listing.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          return {
            type: 'Feature' as const,
            properties: {
              id: listing.id,
              listing,
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [coords[0], coords[1]], // [longitude, latitude]
            },
          };
        })
        .filter((point): point is NonNullable<typeof point> => point !== null);
    }, [markers]);

    // Get map dimensions for clustering
    const mapDimensions = React.useMemo(() => {
      const { Dimensions } = require('react-native');
      return {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      };
    }, []);

    // Convert latitudeDelta to zoom level for clustering
    const regionWithZoom = React.useMemo(() => {
      const zoom = Math.round(Math.log2(360 / region.latitudeDelta));
      const clampedZoom = Math.max(0, Math.min(20, zoom));
      return {
        ...region,
        zoom: clampedZoom,
      };
    }, [region]);

    // Use clusterer hook
    const [points, supercluster] = useClusterer(geoJsonPoints, mapDimensions, regionWithZoom, {
      radius: 30,
      minPoints: 2,
      maxZoom: 9,
      minZoom: 0,
    });

    return (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={paperMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        moveOnMarkerPress={false}>
        {points
          .filter((p) => p && p.properties && p.geometry)
          .map((point: any, index: number) => {
            const { properties, geometry } = point;
            const { coordinates } = geometry;

            if (!coordinates || coordinates.length < 2) return null;

            const [longitude, latitude] = coordinates;

            // Check if it's a cluster
            if (isClusterFeature(point)) {
              const pointCount = properties.point_count || properties.pointCount || 0;
              const clusterId = properties.cluster_id;

              // Get all listings in this cluster to determine category
              let dominantCategory: string | null = null;
              if (supercluster && clusterId !== undefined && typeof clusterId === 'number') {
                try {
                  const leaves = supercluster.getLeaves(clusterId, Infinity);
                  if (leaves && Array.isArray(leaves)) {
                    const categoryCounts: Record<string, number> = {};
                    leaves.forEach((leaf: any) => {
                      const listing = leaf.properties?.listing as ListingRecord | undefined;
                      if (listing?.category) {
                        categoryCounts[listing.category] = (categoryCounts[listing.category] || 0) + 1;
                      }
                    });
                    // Find the most common category
                    let maxCount = 0;
                    Object.entries(categoryCounts).forEach(([category, count]) => {
                      if (count > maxCount) {
                        maxCount = count;
                        dominantCategory = category;
                      }
                    });
                  }
                } catch (error) {
                  // Cluster may have been removed or clusterId is invalid
                  // Continue without category information
                  console.warn('Failed to get cluster leaves:', error);
                }
              }

              return (
                <ClusterMarker
                  key={getClusterKey(latitude, longitude)}
                  latitude={latitude}
                  longitude={longitude}
                  pointCount={pointCount}
                  category={dominantCategory}
                />
              );
            } else {
              // Individual marker
              const listing = properties.listing as ListingRecord;
              if (!listing) return null;

              return (
                <StableMarker
                  key={`marker-${listing.id}`}
                  listing={listing}
                  onPress={() => onMarkerPress(listing)}
                />
              );
            }
          })}
      </MapView>
    );
  }
);
