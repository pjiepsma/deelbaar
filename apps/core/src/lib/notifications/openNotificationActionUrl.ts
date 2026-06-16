import type { MapPlaceCollection } from '../mapPlaces/mapPlaceTaxonomy';
import { navigateToListingDetail } from '../../navigation/rootNavigation';

const MAP_PLACE_COLLECTIONS: ReadonlySet<string> = new Set(['kiosks', 'markets', 'taps']);

function readListingPathFromActionUrl(actionUrl: string): { collection: MapPlaceCollection; id: number } | null {
  const trimmed = actionUrl.trim();
  if (!trimmed.startsWith('deelbaar://listing/')) {
    return null;
  }

  const path = trimmed.slice('deelbaar://listing/'.length);
  const segments = path.split('/').filter((segment) => segment.length > 0);

  if (segments.length === 2 && MAP_PLACE_COLLECTIONS.has(segments[0])) {
    const id = Number.parseInt(segments[1], 10);
    if (Number.isFinite(id)) {
      return { collection: segments[0] as MapPlaceCollection, id };
    }
  }

  if (segments.length === 1) {
    const id = Number.parseInt(segments[0], 10);
    if (Number.isFinite(id)) {
      return { collection: 'kiosks', id };
    }
  }

  return null;
}

export function openNotificationActionUrl(actionUrl: string | null | undefined): void {
  if (!actionUrl || actionUrl.trim().length === 0) {
    return;
  }

  const listingTarget = readListingPathFromActionUrl(actionUrl);
  if (listingTarget) {
    navigateToListingDetail(listingTarget);
  }
}
