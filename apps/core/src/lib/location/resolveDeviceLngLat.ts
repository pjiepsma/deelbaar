import * as Location from 'expo-location';

export async function resolveDeviceLngLat(): Promise<[number, number] | null> {
  const existing = await Location.getForegroundPermissionsAsync();
  let status = existing.status;
  if (status === Location.PermissionStatus.UNDETERMINED) {
    const requested = await Location.requestForegroundPermissionsAsync();
    status = requested.status;
  }
  if (status !== Location.PermissionStatus.GRANTED) {
    return null;
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const lng = position.coords.longitude;
    const lat = position.coords.latitude;
    if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) {
      return null;
    }
    return [lng, lat];
  } catch {
    return null;
  }
}
