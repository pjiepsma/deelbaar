import { TAP_SUBTYPE_OPTIONS } from '../constants/mapPlaces'
import { buildMapPlaceCollection } from './mapPlaces/buildMapPlaceCollection'

export const Taps = buildMapPlaceCollection({
  slug: 'taps',
  placeLabel: 'Tap',
  subtypeFieldName: 'tapSubtype',
  subtypeFieldLabel: 'Tap subtype',
  subtypeOptions: TAP_SUBTYPE_OPTIONS,
  ownerManaged: false,
  allowPhotos: false,
})
