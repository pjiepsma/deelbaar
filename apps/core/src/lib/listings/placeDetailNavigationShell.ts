import type { MapListingCard } from '../../features/map/map.types';
import type { MapPlaceCollection } from '../mapPlaces/mapPlaceTaxonomy';

export type PlaceDetailShellSnapshot = {
  collection: MapPlaceCollection;
  id: number;
  title: string;
  imageUrl?: string;
  mapPlaceCollection: MapPlaceCollection;
  kioskSubtype?: string | null;
  marketSubtype?: string | null;
  tapSubtype?: string | null;
};

let pendingShell: PlaceDetailShellSnapshot | null = null;

export function setPlaceDetailShellSnapshot(card: MapListingCard): void {
  const id = typeof card.id === 'number' ? card.id : Number(card.id);
  if (Number.isNaN(id)) {
    return;
  }
  pendingShell = {
    collection: card.mapPlaceCollection,
    id,
    title: card.title,
    imageUrl: card.imageUrl,
    mapPlaceCollection: card.mapPlaceCollection,
    kioskSubtype: card.kioskSubtype,
    marketSubtype: card.marketSubtype,
    tapSubtype: card.tapSubtype,
  };
}

export function consumePlaceDetailShellSnapshot(
  collection: MapPlaceCollection,
  id: number,
): PlaceDetailShellSnapshot | null {
  if (!pendingShell) {
    return null;
  }
  if (pendingShell.collection !== collection || pendingShell.id !== id) {
    return null;
  }
  const snapshot = pendingShell;
  pendingShell = null;
  return snapshot;
}

export function clearPlaceDetailShellSnapshot(): void {
  pendingShell = null;
}
