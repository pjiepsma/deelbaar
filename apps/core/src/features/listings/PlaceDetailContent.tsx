import { Ionicons } from '@expo/vector-icons';
import { PressableFeedback } from 'heroui-native';
import type { ComponentProps } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TranslateFn } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { mapPlaceFilterLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { mapPlaceCategoryColors } from '../../lib/mapPlaces/mapPlaceCategoryColors';
import type { MapListingCard, MapPlaceRecord } from '../map/map.types';
import {
  PLACE_DETAIL_ACCENT,
  PLACE_DETAIL_BG,
  PLACE_DETAIL_BLOCK_GAP,
  PLACE_DETAIL_FACT_ROW_GAP,
  PLACE_DETAIL_HORIZONTAL_PADDING,
  PLACE_DETAIL_LINK,
  PLACE_DETAIL_PANEL_RADIUS,
  PLACE_DETAIL_SECTION_GAP,
  PLACE_DETAIL_SURFACE,
  PLACE_DETAIL_TEXT_BODY,
  PLACE_DETAIL_TEXT_MUTED,
  PLACE_DETAIL_TEXT_PRIMARY,
  PLACE_DETAIL_TITLE_META_GAP,
} from './placeDetail.constants';
import {
  buildPlaceDetailInfoGrid,
  buildPlaceDetailNotices,
  buildPlaceKindPillLabel,
  buildPlaceSubtypeLabel,
} from './placeDetail.model';
import { PlaceDetailHero, type PlaceDetailHeroMode } from './PlaceDetailHero';
import { PlaceDetailReviewsSection } from './PlaceDetailReviewsSection';
import type { PlaceDetailReviewRow } from './placeDetailReviews.model';
import type { AuthUser } from '../../lib/api/auth/authClient';
import { TestId } from '../../testing/testIds';

type Props = {
  place: MapPlaceRecord;
  card: MapListingCard;
  photoUrls: string[];
  listingLngLat: [number, number] | null;
  userLngLat: [number, number] | null;
  mapboxAccessToken: string | undefined;
  heroMode: PlaceDetailHeroMode;
  onHeroModeChange: (mode: PlaceDetailHeroMode) => void;
  onBack: () => void;
  onSharePress: () => void;
  onSavePress: () => void;
  loved: boolean;
  reviews: PlaceDetailReviewRow[];
  user: AuthUser | null | undefined;
  onLeaveReviewPress: () => void;
  canAddPhoto: boolean;
  addPhotoEnabled: boolean;
  onAddPhotoPress: () => void;
  onNoticePress: (noticeId: string) => void;
  onSeeAllNoticesPress: () => void;
  t: TranslateFn;
};

export function PlaceDetailContent({
  place,
  card,
  photoUrls,
  listingLngLat,
  userLngLat,
  mapboxAccessToken,
  heroMode,
  onHeroModeChange,
  onBack,
  onSharePress,
  onSavePress,
  loved,
  reviews,
  user,
  onLeaveReviewPress,
  canAddPhoto,
  addPhotoEnabled,
  onAddPhotoPress,
  onNoticePress,
  onSeeAllNoticesPress,
  t,
}: Props) {
  const insets = useSafeAreaInsets();

  const distanceInMeta = card.distanceKm !== undefined;
  const infoCells = buildPlaceDetailInfoGrid(place, card, t, { omitDistance: distanceInMeta });
  const notices = buildPlaceDetailNotices(place, t);
  const kindPill = buildPlaceKindPillLabel(place, t);
  const categoryColors = mapPlaceCategoryColors(place.mapPlaceCollection);
  const collectionLabel = mapPlaceFilterLabel(place.mapPlaceCollection, t);
  const subtypeLabel = buildPlaceSubtypeLabel(place, t);

  const saveAccessibilityLabel = loved ? t('map.favoriteRemove') : t('map.favoriteAdd');

  const photoCountLabel =
    photoUrls.length > 0
      ? t('listing.photoCount', { count: String(photoUrls.length) })
      : t('listing.noPhotos');

  const showRating = card.rating !== undefined && card.reviews !== undefined;

  const infoRows: Array<typeof infoCells> = [];
  for (let i = 0; i < infoCells.length; i += 2) {
    infoRows.push(infoCells.slice(i, i + 2));
  }

  return (
    <View testID={TestId.screenListingDetail} style={{ flex: 1, backgroundColor: PLACE_DETAIL_BG }}>
      <PlaceDetailHero
        heroMode={heroMode}
        onHeroModeChange={onHeroModeChange}
        mapPlaceCollection={place.mapPlaceCollection}
        photoUrls={photoUrls}
        listingLngLat={listingLngLat}
        userLngLat={userLngLat}
        mapboxAccessToken={mapboxAccessToken}
        photoCountLabel={photoCountLabel}
        showPhotosLabel={t('listing.showPhotos')}
        showMapAccessibilityLabel={t('listing.showMap')}
        onBack={onBack}
        onSharePress={onSharePress}
        shareAccessibilityLabel={t('listing.share')}
        onSavePress={onSavePress}
        loved={loved}
        saveAccessibilityLabel={saveAccessibilityLabel}
        addPhotoLabel={t('listing.addPhotoShort')}
        addPhotoAccessibilityLabel={t('listing.addPhoto')}
        canAddPhoto={canAddPhoto}
        addPhotoEnabled={addPhotoEnabled}
        onAddPhotoPress={onAddPhotoPress}
      />

      <View
        style={{
          flex: 1,
          marginTop: -PLACE_DETAIL_PANEL_RADIUS,
          backgroundColor: PLACE_DETAIL_BG,
          borderTopLeftRadius: PLACE_DETAIL_PANEL_RADIUS,
          borderTopRightRadius: PLACE_DETAIL_PANEL_RADIUS,
          overflow: 'hidden',
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: PLACE_DETAIL_HORIZONTAL_PADDING,
            paddingTop: PLACE_DETAIL_SECTION_GAP,
            paddingBottom: insets.bottom + PLACE_DETAIL_SECTION_GAP,
            gap: PLACE_DETAIL_BLOCK_GAP,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: PLACE_DETAIL_TITLE_META_GAP }}>
            <Text
              style={{
                color: PLACE_DETAIL_TEXT_PRIMARY,
                fontSize: 26,
                fontWeight: '700',
                lineHeight: 32,
              }}
            >
              {place.name}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <View
                style={{
                  backgroundColor: categoryColors.badgeBackground,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: categoryColors.badgeForeground, fontSize: 13, fontWeight: '600' }}>
                  {kindPill}
                </Text>
              </View>
              {showRating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={16} color={PLACE_DETAIL_ACCENT} />
                  <Text style={{ color: PLACE_DETAIL_TEXT_PRIMARY, fontSize: 14, fontWeight: '600' }}>
                    {card.rating!.toFixed(1)}
                  </Text>
                  <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 14 }}>
                    ({String(card.reviews)})
                  </Text>
                </View>
              ) : null}
              {distanceInMeta ? (
                <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 14 }}>
                  {t('map.distanceAway', { km: card.distanceKm!.toFixed(1) })}
                </Text>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 20 }}>
              <AttributePair icon="storefront-outline" label={collectionLabel} />
              <AttributePair icon="pricetag-outline" label={subtypeLabel} />
            </View>
          </View>

          {place.description.trim().length > 0 ? (
            <Text style={{ color: PLACE_DETAIL_TEXT_BODY, fontSize: 15, lineHeight: 24 }}>
              {place.description.trim()}
            </Text>
          ) : null}

          {infoRows.length > 0 ? (
            <View style={{ gap: PLACE_DETAIL_FACT_ROW_GAP }}>
              {infoRows.map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', gap: 16 }}>
                  {row.map((cell) => (
                    <View key={cell.labelKey} style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: PLACE_DETAIL_TEXT_MUTED,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {t(cell.labelKey)}
                      </Text>
                      <Text
                        style={{
                          color: PLACE_DETAIL_TEXT_PRIMARY,
                          fontSize: 17,
                          fontWeight: '600',
                          marginTop: 4,
                        }}
                      >
                        {cell.value}
                      </Text>
                    </View>
                  ))}
                  {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                </View>
              ))}
            </View>
          ) : null}

          {notices.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {notices.map((notice) => (
                  <PressableFeedback
                    key={notice.id}
                    onPress={() => onNoticePress(notice.id)}
                    accessibilityLabel={notice.title}
                  >
                    <View
                      style={{
                        width: 280,
                        backgroundColor: PLACE_DETAIL_SURFACE,
                        borderRadius: 12,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ color: PLACE_DETAIL_TEXT_PRIMARY, fontSize: 15, fontWeight: '600' }}>
                          {notice.title}
                        </Text>
                        {notice.detail ? (
                          <Text style={{ color: PLACE_DETAIL_TEXT_BODY, fontSize: 13 }} numberOfLines={2}>
                            {notice.detail}
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: PLACE_DETAIL_ACCENT,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="information" size={22} color="#fff" />
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={PLACE_DETAIL_TEXT_MUTED} />
                    </View>
                  </PressableFeedback>
                ))}
              </View>
            </ScrollView>
          ) : null}

          {notices.length > 1 ? (
            <PressableFeedback onPress={onSeeAllNoticesPress}>
              <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                <Text style={{ color: PLACE_DETAIL_LINK, fontSize: 15, fontWeight: '600' }}>
                  {t('listing.seeAllNotices')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={PLACE_DETAIL_LINK} />
              </View>
            </PressableFeedback>
          ) : null}

          <PlaceDetailReviewsSection
            reviews={reviews}
            user={user}
            t={t}
            onLeaveReviewPress={onLeaveReviewPress}
          />
        </ScrollView>
      </View>
    </View>
  );
}

function AttributePair({ icon, label }: { icon: ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={18} color={PLACE_DETAIL_TEXT_MUTED} />
      <Text style={{ color: PLACE_DETAIL_TEXT_MUTED, fontSize: 14 }}>{label}</Text>
    </View>
  );
}
