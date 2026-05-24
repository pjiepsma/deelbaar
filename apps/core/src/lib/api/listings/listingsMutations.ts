import type { Config } from '../../types/payload-generated';
import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import { getPayloadSdk } from '../payloadSdk';

type CollectionDoc<C extends MapPlaceCollection> = Config['collections'][C];
type CollectionCreateData<C extends MapPlaceCollection> = Partial<
  Omit<CollectionDoc<C>, 'id' | 'createdAt' | 'updatedAt'>
>;

export type CreateMapPlaceInput<C extends MapPlaceCollection> = {
  collection: C;
  data: CollectionCreateData<C>;
};

export type UpdateMapPlaceInput<C extends MapPlaceCollection> = {
  collection: C;
  id: CollectionDoc<C>['id'];
  data: Partial<Omit<CollectionDoc<C>, 'id' | 'createdAt' | 'updatedAt'>>;
};

export async function createMapPlace<C extends MapPlaceCollection>(
  input: CreateMapPlaceInput<C>,
): Promise<CollectionDoc<C>> {
  const sdk = getPayloadSdk();
  const doc = await sdk.create({
    collection: input.collection,
    // Payload accepts nested partials; generated Listing is stricter than REST create body.
    data: input.data as never,
  });
  return doc as CollectionDoc<C>;
}

export async function updateMapPlace<C extends MapPlaceCollection>(
  input: UpdateMapPlaceInput<C>,
): Promise<CollectionDoc<C>> {
  const sdk = getPayloadSdk();
  const doc = await sdk.update({
    collection: input.collection,
    id: input.id,
    data: input.data as never,
  });
  return doc as CollectionDoc<C>;
}

export async function softDeleteMapPlace<C extends MapPlaceCollection>(
  collection: C,
  id: CollectionDoc<C>['id'],
): Promise<CollectionDoc<C>> {
  return updateMapPlace({
    collection,
    id,
    data: { deletedAt: new Date().toISOString() } as Partial<
      Omit<CollectionDoc<C>, 'id' | 'createdAt' | 'updatedAt'>
    >,
  });
}

export async function restoreMapPlace<C extends MapPlaceCollection>(
  collection: C,
  id: CollectionDoc<C>['id'],
): Promise<CollectionDoc<C>> {
  return updateMapPlace({
    collection,
    id,
    data: { deletedAt: null } as Partial<Omit<CollectionDoc<C>, 'id' | 'createdAt' | 'updatedAt'>>,
  });
}
