import * as Location from 'expo-location';

function coordsFromPosition(position: Location.LocationObject): [number, number] | null {
  const lng = position.coords.longitude;
  const lat = position.coords.latitude;
  if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) {
    return null;
  }
  return [lng, lat];
}

export async function resolveDeviceLngLat(): Promise<[number, number] | null> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return null;
  }

  const existing = await Location.getForegroundPermissionsAsync();
  let status = existing.status;
  if (status === Location.PermissionStatus.UNDETERMINED) {
    const requested = await Location.requestForegroundPermissionsAsync();
    status = requested.status;
  }
  if (status !== Location.PermissionStatus.GRANTED) {
    return null;
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) {
    const lngLat = coordsFromPosition(lastKnown);
    if (lngLat) {
      return lngLat;
    }
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return coordsFromPosition(position);
  } catch {
    return null;
  }
}
