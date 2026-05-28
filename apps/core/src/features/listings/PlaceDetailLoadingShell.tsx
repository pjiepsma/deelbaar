import { Ionicons } from '@expo/vector-icons';
import { Spinner } from 'heroui-native';
import { Image, Text, View } from 'react-native';

import type { TranslateFn } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { buildMapPlaceKindLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { mapPlaceCategoryColors } from '../../lib/mapPlaces/mapPlaceCategoryColors';
import type { PlaceDetailShellSnapshot } from '../../lib/listings/placeDetailNavigationShell';
import {
  PLACE_DETAIL_BG,
  PLACE_DETAIL_HORIZONTAL_PADDING,
  PLACE_DETAIL_HERO_PLACEHOLDER,
  placeDetailHeroHeight,
} from './placeDetail.constants';
import { HeroChromeButton } from './HeroChromeButton';

type Props = {
  shell: PlaceDetailShellSnapshot;
  onBack: () => void;
  t: TranslateFn;
  topInset: number;
};

export function PlaceDetailLoadingShell({ shell, onBack, t, topInset }: Props) {
  const heroHeight = placeDetailHeroHeight();
  const categoryColors = mapPlaceCategoryColors(shell.mapPlaceCollection);
  const kindLabel = buildMapPlaceKindLabel(shell, t);

  return (
    <View style={{ flex: 1, backgroundColor: PLACE_DETAIL_BG }}>
      <View style={{ height: heroHeight, backgroundColor: PLACE_DETAIL_HERO_PLACEHOLDER }}>
        {shell.imageUrl ? (
          <Image source={{ uri: shell.imageUrl }} style={{ width: '100%', height: heroHeight }} resizeMode="cover" />
        ) : null}
        <View
          style={{
            position: 'absolute',
            top: topInset + 8,
            left: PLACE_DETAIL_HORIZONTAL_PADDING,
          }}
        >
          <HeroChromeButton onPress={onBack} accessibilityLabel={t('listing.back')}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </HeroChromeButton>
        </View>
      </View>
      <View style={{ paddingHorizontal: PLACE_DETAIL_HORIZONTAL_PADDING, paddingTop: 20, gap: 12 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: categoryColors.badgeBackground,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: categoryColors.badgeForeground, fontSize: 12, fontWeight: '600' }}>
            {kindLabel}
          </Text>
        </View>
        <Text className="text-foreground text-2xl font-semibold">{shell.title}</Text>
        <View style={{ paddingTop: 24, alignItems: 'center' }}>
          <Spinner size="md" />
        </View>
      </View>
    </View>
  );
}
