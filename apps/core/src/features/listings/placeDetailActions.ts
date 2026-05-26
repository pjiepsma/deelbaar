import { Alert } from 'react-native';

import type { TranslateFn } from '../../lib/mapPlaces/mapPlaceTaxonomy';

export function showPlaceDetailContributorComingSoon(t: TranslateFn): void {
  Alert.alert(t('map.previewActionComingSoonTitle'), t('map.previewActionComingSoonDescription'));
}
