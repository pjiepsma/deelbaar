import { router } from 'expo-router';

import type { CmsLegalPage } from '../lib/legal/cmsLegal.types';
import type { MapPlaceCollection } from '../lib/mapPlaces/mapPlaceTaxonomy';

import { AccountPath, accountListingEditPath } from './accountPaths';
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

export function navigateToAccountListings(): void {
  router.push(AccountPath.listings);
}

export function navigateToAccountListingNew(): void {
  router.push(AccountPath.listingsNew);
}

export function navigateToAccountListingEdit(params: {
  collection: MapPlaceCollection;
  id: number | string;
}): void {
  router.push(accountListingEditPath(params));
}

export function navigateToAccountPath(path: (typeof AccountPath)[keyof typeof AccountPath]): void {
  router.push(path);
}
