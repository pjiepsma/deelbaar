import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { RootStackParamList } from '../features/auth/auth.types';
import type { MapPlaceCollection } from '../lib/mapPlaces/mapPlaceTaxonomy';

export function getRootStackNavigator(
  navigation: NavigationProp<ParamListBase>,
): NavigationProp<RootStackParamList> | undefined {
  const tabNav = navigation.getParent();
  if (!tabNav) {
    return undefined;
  }
  const stackNav = tabNav.getParent() as NavigationProp<RootStackParamList> | undefined;
  return stackNav ?? (tabNav as NavigationProp<RootStackParamList>);
}

export function navigateToAuthModal(navigation: NavigationProp<ParamListBase>): void {
  const root = getRootStackNavigator(navigation);
  root?.navigate('Auth', { screen: 'AuthStart' });
}

export function navigateToListingDetail(
  navigation: NavigationProp<ParamListBase>,
  params: { collection: MapPlaceCollection; id: number },
): void {
  const root = getRootStackNavigator(navigation);
  root?.navigate('ListingDetail', params);
}
