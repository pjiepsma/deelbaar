import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export type TabRouteName = 'map' | 'favorites' | 'account';

export type TabIoniconName = ComponentProps<typeof Ionicons>['name'];

export type TabLabelKey = `tabs.${TabRouteName}`;

export interface TabConfig {
  name: TabRouteName;
  labelKey: TabLabelKey;
  ionicon: TabIoniconName;
  ioniconFocused: TabIoniconName;
}

export const TABS: readonly TabConfig[] = [
  {
    name: 'map',
    labelKey: 'tabs.map',
    ionicon: 'search-outline',
    ioniconFocused: 'search',
  },
  {
    name: 'favorites',
    labelKey: 'tabs.favorites',
    ionicon: 'heart-outline',
    ioniconFocused: 'heart',
  },
  {
    name: 'account',
    labelKey: 'tabs.account',
    ionicon: 'person-circle-outline',
    ioniconFocused: 'person-circle',
  },
];
