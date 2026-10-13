import type { MapPlaceCollection } from '../lib/mapPlaces/mapPlaceTaxonomy';

export const AccountPath = {
  listings: '/account/listings',
  listingsNew: '/account/listings/new',
  profile: '/account/profile',
  guidelines: '/account/guidelines',
  homeArea: '/account/home-area',
  reach: '/account/reach',
  notificationSettings: '/account/notification-settings',
  data: '/account/data',
  language: '/account/language',
  theme: '/account/theme',
  location: '/account/location',
  help: '/account/help',
} as const;

export function accountListingEditPath(params: {
  collection: MapPlaceCollection;
  id: number | string;
}): string {
  return `/account/listings/${params.collection}/${params.id}`;
}
