import { KIOSK_SUBTYPE_OPTIONS } from '../constants/mapPlaces'
import { buildMapPlaceCollection } from './mapPlaces/buildMapPlaceCollection'

export const Kiosks = buildMapPlaceCollection({
  slug: 'kiosks',
  placeLabel: 'Kiosk',
  subtypeFieldName: 'kioskSubtype',
  subtypeFieldLabel: 'Kiosk subtype',
  subtypeOptions: KIOSK_SUBTYPE_OPTIONS,
  ownerManaged: true,
  allowPhotos: true,
})
