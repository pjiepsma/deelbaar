import * as Location from 'expo-location';

/** Stale last-known must not fake a successful my-location move (emulator defaults linger for hours). */
const LAST_KNOWN_MAX_AGE_MS = 60_000;

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

  // Balanced + mayShowUserSettingsDialog(true) fails with "unsatisfied device settings"
  // when Google Location Accuracy is off (Expo emulator guidance). Prefer GPS High, no dialog.
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: false,
    });
    const current = coordsFromPosition(position);
    if (current) {
      return current;
    }
  } catch {
    // Fall through to fresh last-known.
  }

  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
  });
  if (lastKnown) {
    return coordsFromPosition(lastKnown);
  }

  return null;
}
