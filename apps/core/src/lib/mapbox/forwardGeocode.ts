export const FORWARD_GEOCODE_MIN_QUERY_LENGTH = 3;

export type GeocodeSuggestion = {
  id: string;
  label: string;
  lngLat: [number, number];
};

export type ForwardGeocodeError = 'missing_token' | 'network' | 'invalid_response';

export type ForwardGeocodeResult =
  | { ok: true; suggestions: GeocodeSuggestion[] }
  | { ok: false; error: ForwardGeocodeError };

type V6Feature = {
  id?: string;
  geometry?: {
    coordinates?: unknown;
  };
  properties?: {
    full_address?: string;
    name?: string;
    name_preferred?: string;
    coordinates?: {
      longitude?: number;
      latitude?: number;
    };
  };
};

type V6Response = {
  features?: V6Feature[];
};

function parseFeature(feature: V6Feature): GeocodeSuggestion | null {
  const id = feature.id;
  if (!id) {
    return null;
  }

  let lng: number | undefined;
  let lat: number | undefined;

  const propsCoords = feature.properties?.coordinates;
  if (
    typeof propsCoords?.longitude === 'number' &&
    typeof propsCoords?.latitude === 'number' &&
    !Number.isNaN(propsCoords.longitude) &&
    !Number.isNaN(propsCoords.latitude)
  ) {
    lng = propsCoords.longitude;
    lat = propsCoords.latitude;
  } else {
    const geometryCoords = feature.geometry?.coordinates;
    if (Array.isArray(geometryCoords) && geometryCoords.length >= 2) {
      const geometryLng = geometryCoords[0];
      const geometryLat = geometryCoords[1];
      if (
        typeof geometryLng === 'number' &&
        typeof geometryLat === 'number' &&
        !Number.isNaN(geometryLng) &&
        !Number.isNaN(geometryLat)
      ) {
        lng = geometryLng;
        lat = geometryLat;
      }
    }
  }

  if (lng === undefined || lat === undefined) {
    return null;
  }

  const label =
    feature.properties?.full_address ??
    feature.properties?.name_preferred ??
    feature.properties?.name;
  if (!label) {
    return null;
  }

  return { id, label, lngLat: [lng, lat] };
}

export async function forwardGeocode(
  query: string,
  accessToken: string,
  proximityLngLat?: [number, number],
): Promise<ForwardGeocodeResult> {
  if (!accessToken) {
    return { ok: false, error: 'missing_token' };
  }

  const trimmed = query.trim();
  if (trimmed.length < FORWARD_GEOCODE_MIN_QUERY_LENGTH) {
    return { ok: true, suggestions: [] };
  }

  const params = new URLSearchParams({
    q: trimmed,
    access_token: accessToken,
    country: 'nl',
    limit: '5',
    language: 'nl,en',
  });

  if (proximityLngLat) {
    params.set('proximity', `${proximityLngLat[0]},${proximityLngLat[1]}`);
  }

  const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, error: 'network' };
    }

    const data = (await response.json()) as V6Response;
    if (!Array.isArray(data.features)) {
      return { ok: false, error: 'invalid_response' };
    }

    const suggestions = data.features
      .map((feature) => parseFeature(feature))
      .filter((item): item is GeocodeSuggestion => item !== null);

    return { ok: true, suggestions };
  } catch {
    return { ok: false, error: 'network' };
  }
}
