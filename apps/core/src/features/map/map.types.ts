import type { Listing as PayloadListing } from '../../../lib/types/payload-generated';

export type MapListingCard = {
  id: string;
  title: string;
  categorySlug: PayloadListing['category'];
  categoryLabel: string;
  distanceKm?: number;
  rating?: number;
  reviews?: number;
  imageUrl?: string;
  loved?: boolean;
};
