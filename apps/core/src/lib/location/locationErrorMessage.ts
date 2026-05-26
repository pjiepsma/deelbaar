import type { TranslateFn } from '../mapPlaces/mapPlaceTaxonomy';

export function locationErrorMessage(error: unknown, t: TranslateFn): string {
  if (!(error instanceof Error)) {
    return t('auth.locationUnavailable');
  }
  const message = error.message.toLowerCase();
  if (message.includes('permission') || message.includes('denied')) {
    return t('auth.locationPermissionDenied');
  }
  if (message.includes('unavailable') || message.includes('location services')) {
    return t('auth.locationUnavailable');
  }
  return error.message;
}
