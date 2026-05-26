import { router } from 'expo-router';

import type { CmsLegalPage } from '../lib/legal/cmsLegal.types';
import type { MapPlaceCollection } from '../lib/mapPlaces/mapPlaceTaxonomy';

import { AuthPath } from './authPaths';

export function navigateToAuthStart(): void {
  router.push(AuthPath.start);
}

export function navigateToListingDetail(params: { collection: MapPlaceCollection; id: number }): void {
  router.push(`/listing/${params.collection}/${params.id}`);
}

export function navigateToLegalDocument(params: { page: CmsLegalPage }): void {
  router.push(`/legal/${params.page}`);
}
