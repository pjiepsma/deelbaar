import { MARKET_SUBTYPE_OPTIONS } from '../constants/mapPlaces'
import { buildMapPlaceCollection } from './mapPlaces/buildMapPlaceCollection'

export const Markets = buildMapPlaceCollection({
  slug: 'markets',
  placeLabel: 'Market',
  subtypeFieldName: 'marketSubtype',
  subtypeFieldLabel: 'Market subtype',
  subtypeOptions: MARKET_SUBTYPE_OPTIONS,
  ownerManaged: true,
  allowPhotos: true,
})
