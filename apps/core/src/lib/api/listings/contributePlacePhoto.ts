import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import { getPayloadRuntime } from '../payloadRuntime';

const JWT_PREFIX = 'JWT ';
const AUTHORIZATION_HEADER = 'Authorization';

export type ContributePlacePhotoFile = {
  uri: string;
  name: string;
  type: string;
};

export async function contributePlacePhoto(params: {
  collection: MapPlaceCollection;
  placeId: number;
  file: ContributePlacePhotoFile;
}): Promise<void> {
  const runtime = getPayloadRuntime();
  const form = new FormData();
  form.append('collection', params.collection);
  form.append('placeId', String(params.placeId));
  form.append('file', {
    uri: params.file.uri,
    name: params.file.name,
    type: params.file.type,
  } as unknown as Blob);

  const headers: Record<string, string> = {};
  if (runtime.token) {
    headers[AUTHORIZATION_HEADER] = `${JWT_PREFIX}${runtime.token}`;
  }

  const response = await fetch(`${runtime.baseURL}/listings/contribute-photo`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Photo upload failed (${response.status}): ${bodyText}`);
  }
}
