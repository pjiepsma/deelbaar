import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import type { MapPlaceCollection } from '../../lib/mapPlaces/mapPlaceTaxonomy';

export async function sharePlace(params: {
  name: string;
  collection: MapPlaceCollection;
  placeId: number;
}): Promise<void> {
  const url = Linking.createURL(`/listing/${params.collection}/${params.placeId}`);
  await Share.share({
    message: `${params.name}\n${url}`,
    title: params.name,
  });
}
