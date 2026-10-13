import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'heroui-native';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import { mapPlaceFilterIconColor } from '../../lib/mapPlaces/mapPlaceCategoryColors';
import {
  MAP_PLACE_FILTER_VALUES,
  mapPlaceFilterLabel,
  type MapPlaceFilterValue,
} from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { fireHaptic } from '../../lib/utils/fire-haptic';
import { TestId } from '../../testing/testIds';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Equal-width row until this many filters; then horizontal scroll. */
const MAP_FILTER_SCROLL_MIN_COUNT = 5;

const FILTER_ICONS: Record<MapPlaceFilterValue, IoniconName> = {
  All: 'apps-outline',
  kiosks: 'storefront-outline',
  markets: 'leaf-outline',
  taps: 'water-outline',
};

type Props = {
  value: MapPlaceFilterValue;
  onChange: (value: MapPlaceFilterValue) => void;
};

function isMapPlaceFilterValue(value: string): value is MapPlaceFilterValue {
  return (MAP_PLACE_FILTER_VALUES as readonly string[]).includes(value);
}

export function MapCategoryFilter({ value, onChange }: Props) {
  const { t } = useLocale();
  const useScroll = MAP_PLACE_FILTER_VALUES.length >= MAP_FILTER_SCROLL_MIN_COUNT;

  const onValueChange = (next: string): void => {
    if (!isMapPlaceFilterValue(next) || next === value) {
      return;
    }
    fireHaptic();
    onChange(next);
  };

  const triggers = MAP_PLACE_FILTER_VALUES.map((filter) => (
    <Tabs.Trigger
      key={filter}
      value={filter}
      testID={TestId.filterMap(filter)}
      className={useScroll ? 'min-h-11 px-3' : 'min-h-11 flex-1 px-1'}
      accessibilityLabel={mapPlaceFilterLabel(filter, t)}
    >
      {() => (
        <View className="flex-row items-center justify-center gap-1">
          <Ionicons name={FILTER_ICONS[filter]} size={16} color={mapPlaceFilterIconColor(filter)} />
          <Tabs.Label numberOfLines={1}>{mapPlaceFilterLabel(filter, t)}</Tabs.Label>
        </View>
      )}
    </Tabs.Trigger>
  ));

  return (
    <Tabs value={value} onValueChange={onValueChange} variant="primary" className="w-full">
      <Tabs.List className="w-full">
        <FilterListShell useScroll={useScroll}>
          <Tabs.Indicator />
          {triggers}
        </FilterListShell>
      </Tabs.List>
    </Tabs>
  );
}

function FilterListShell({
  useScroll,
  children,
}: {
  useScroll: boolean;
  children: ReactNode;
}) {
  if (useScroll) {
    return (
      <Tabs.ScrollView scrollAlign="start" contentContainerClassName="gap-1 px-0.5 py-0.5">
        {children}
      </Tabs.ScrollView>
    );
  }

  return <View className="w-full flex-row items-stretch gap-1 px-0.5 py-0.5">{children}</View>;
}
