import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import { PressableFeedback } from 'heroui-native';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroChromeButton } from './HeroChromeButton';
import { useThemePreference } from '../../context/ThemePreferenceContext';
import { MAPBOX_STYLE_DARK, MAPBOX_STYLE_STREETS } from '../map/map.constants';
import {
  PLACE_DETAIL_ACCENT,
  PLACE_DETAIL_CTA_SECONDARY,
  PLACE_DETAIL_HERO_PLACEHOLDER,
  PLACE_DETAIL_HERO_DISABLED_OPACITY,
  PLACE_DETAIL_HORIZONTAL_PADDING,
  PLACE_DETAIL_MAP_THUMB_SIZE,
  PLACE_DETAIL_TAG_TEXT,
  PLACE_DETAIL_TEXT_MUTED,
  PLACE_DETAIL_TOGGLE_PILL_HEIGHT,
  placeDetailHeroChromeBottom,
  placeDetailHeroHeight,
} from './placeDetail.constants';

export type PlaceDetailHeroMode = 'photos' | 'map';

type Props = {
  heroMode: PlaceDetailHeroMode;
  onHeroModeChange: (mode: PlaceDetailHeroMode) => void;
  photoUrls: string[];
  listingLngLat: [number, number] | null;
  userLngLat: [number, number] | null;
  mapboxAccessToken: string | undefined;
  photoCountLabel: string;
  showPhotosLabel: string;
  showMapAccessibilityLabel: string;
  onBack: () => void;
  onSavePress: () => void;
  loved: boolean;
  saveAccessibilityLabel: string;
  addPhotoLabel: string;
  addPhotoAccessibilityLabel: string;
  signedIn: boolean;
  onAddPhotoPress: () => void;
};

const LISTING_MAP_ZOOM = 14;
const TOP_CHROME_PADDING = 8;

export function PlaceDetailHero({
  heroMode,
  onHeroModeChange,
  photoUrls,
  listingLngLat,
  userLngLat,
  mapboxAccessToken,
  photoCountLabel,
  showPhotosLabel,
  showMapAccessibilityLabel,
  onBack,
  onSavePress,
  loved,
  saveAccessibilityLabel,
  addPhotoLabel,
  addPhotoAccessibilityLabel,
  signedIn,
  onAddPhotoPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const heroHeight = placeDetailHeroHeight();
  const { resolvedScheme } = useThemePreference();
  const [photoIndex, setPhotoIndex] = useState(0);
  const mapCameraRef = useRef<Mapbox.Camera>(null);

  const mapStyleURL = resolvedScheme === 'dark' ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_STREETS;

  const cameraCenter = useMemo(() => {
    if (!listingLngLat) {
      return null;
    }
    if (!userLngLat) {
      return { center: listingLngLat, zoom: LISTING_MAP_ZOOM };
    }
    const lngs = [listingLngLat[0], userLngLat[0]];
    const lats = [listingLngLat[1], userLngLat[1]];
    const center: [number, number] = [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
    const span = Math.max(
      Math.abs(lngs[0] - lngs[1]),
      Math.abs(lats[0] - lats[1]),
      0.02,
    );
    const zoom = span > 0.15 ? 11 : span > 0.05 ? 12 : LISTING_MAP_ZOOM;
    return { center, zoom };
  }, [listingLngLat, userLngLat]);

  useEffect(() => {
    if (heroMode !== 'map' || !cameraCenter) {
      return;
    }
    const timer = setTimeout(() => {
      mapCameraRef.current?.setCamera({
        centerCoordinate: cameraCenter.center,
        zoomLevel: cameraCenter.zoom,
        animationDuration: 0,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [heroMode, cameraCenter]);

  const onPhotoScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setPhotoIndex(index);
  }, [screenWidth]);

  const toggleToMap = useCallback(() => onHeroModeChange('map'), [onHeroModeChange]);
  const toggleToPhotos = useCallback(() => onHeroModeChange('photos'), [onHeroModeChange]);

  const thumbPhotoUrl = photoUrls[0];
  const canShowMap = listingLngLat !== null;

  const renderHeroMedia = () => {
    if (heroMode === 'photos') {
      if (photoUrls.length > 0) {
        return (
          <FlatList
            data={photoUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
            style={{ width: screenWidth, height: heroHeight }}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: screenWidth, height: heroHeight }}
                resizeMode="cover"
              />
            )}
          />
        );
      }
      return <HeroPlaceholder heroHeight={heroHeight} icon="images-outline" />;
    }

    if (canShowMap && mapboxAccessToken && cameraCenter) {
      return (
        <Mapbox.MapView
          key="hero-map"
          style={{ width: screenWidth, height: heroHeight }}
          styleURL={mapStyleURL}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <Mapbox.Camera
            ref={mapCameraRef}
            defaultSettings={{
              centerCoordinate: cameraCenter.center,
              zoomLevel: cameraCenter.zoom,
            }}
          />
          <Mapbox.PointAnnotation id="listing" coordinate={listingLngLat}>
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: PLACE_DETAIL_ACCENT,
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          </Mapbox.PointAnnotation>
          {userLngLat ? (
            <Mapbox.PointAnnotation id="user" coordinate={userLngLat}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#2563eb',
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              />
            </Mapbox.PointAnnotation>
          ) : null}
        </Mapbox.MapView>
      );
    }

    return <HeroPlaceholder heroHeight={heroHeight} icon="map-outline" />;
  };

  return (
    <View
      style={{
        height: heroHeight,
        width: '100%',
        backgroundColor: '#000',
      }}
    >
      <View
        style={{
          height: heroHeight,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {renderHeroMedia()}
      </View>

      <View
        pointerEvents="box-none"
        style={{
          marginTop: -heroHeight,
          height: heroHeight,
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: insets.top + TOP_CHROME_PADDING,
          paddingBottom: placeDetailHeroChromeBottom(),
          paddingHorizontal: PLACE_DETAIL_HORIZONTAL_PADDING,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <HeroChromeButton onPress={onBack} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </HeroChromeButton>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <HeroChromeButton onPress={() => undefined} accessibilityLabel="Share">
              <Ionicons name="share-outline" size={20} color="#1A1A1A" />
            </HeroChromeButton>
            <HeroChromeButton onPress={onSavePress} accessibilityLabel={saveAccessibilityLabel}>
              <Ionicons name={loved ? 'heart' : 'heart-outline'} size={20} color="#1A1A1A" />
            </HeroChromeButton>
          </View>
        </View>

        <HeroBottomControlsRow
          heroMode={heroMode}
          photoUrls={photoUrls}
          photoIndex={photoIndex}
          photoCountLabel={photoCountLabel}
          showPhotosLabel={showPhotosLabel}
          showMapAccessibilityLabel={showMapAccessibilityLabel}
          addPhotoLabel={addPhotoLabel}
          addPhotoAccessibilityLabel={addPhotoAccessibilityLabel}
          signedIn={signedIn}
          canShowMap={canShowMap}
          thumbPhotoUrl={thumbPhotoUrl}
          mapboxAccessToken={mapboxAccessToken}
          listingLngLat={listingLngLat}
          mapStyleURL={mapStyleURL}
          onToggleToMap={toggleToMap}
          onToggleToPhotos={toggleToPhotos}
          onAddPhotoPress={onAddPhotoPress}
        />
      </View>
    </View>
  );
}

type HeroBottomControlsRowProps = {
  heroMode: PlaceDetailHeroMode;
  photoUrls: string[];
  photoIndex: number;
  photoCountLabel: string;
  showPhotosLabel: string;
  showMapAccessibilityLabel: string;
  addPhotoLabel: string;
  addPhotoAccessibilityLabel: string;
  signedIn: boolean;
  canShowMap: boolean;
  thumbPhotoUrl: string | undefined;
  mapboxAccessToken: string | undefined;
  listingLngLat: [number, number] | null;
  mapStyleURL: string;
  onToggleToMap: () => void;
  onToggleToPhotos: () => void;
  onAddPhotoPress: () => void;
};

function HeroBottomControlsRow({
  heroMode,
  photoUrls,
  photoIndex,
  photoCountLabel,
  showPhotosLabel,
  showMapAccessibilityLabel,
  addPhotoLabel,
  addPhotoAccessibilityLabel,
  signedIn,
  canShowMap,
  thumbPhotoUrl,
  mapboxAccessToken,
  listingLngLat,
  mapStyleURL,
  onToggleToMap,
  onToggleToPhotos,
  onAddPhotoPress,
}: HeroBottomControlsRowProps) {
  const showDots = heroMode === 'photos' && photoUrls.length > 1;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
      <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        {heroMode === 'photos' ? (
          <PressableFeedback
            onPress={onAddPhotoPress}
            accessibilityLabel={addPhotoAccessibilityLabel}
            isDisabled={!signedIn}
          >
            <HeroOverlayPill opacity={signedIn ? 1 : PLACE_DETAIL_HERO_DISABLED_OPACITY}>
              <Ionicons name="camera-outline" size={16} color={PLACE_DETAIL_TAG_TEXT} />
              <Text style={{ color: PLACE_DETAIL_TAG_TEXT, fontSize: 13, fontWeight: '600' }}>
                {addPhotoLabel}
              </Text>
            </HeroOverlayPill>
          </PressableFeedback>
        ) : null}

        <PressableFeedback
          onPress={heroMode === 'photos' ? onToggleToMap : onToggleToPhotos}
          accessibilityLabel={heroMode === 'photos' ? showMapAccessibilityLabel : showPhotosLabel}
          isDisabled={heroMode === 'photos' && !canShowMap}
        >
          <HeroOverlayPill>
            <Ionicons
              name={heroMode === 'photos' ? 'images-outline' : 'images'}
              size={16}
              color={PLACE_DETAIL_TAG_TEXT}
            />
            <Text style={{ color: PLACE_DETAIL_TAG_TEXT, fontSize: 13, fontWeight: '600' }}>
              {heroMode === 'photos' ? photoCountLabel : showPhotosLabel}
            </Text>
          </HeroOverlayPill>
        </PressableFeedback>
      </View>

      {showDots ? (
        <View
          pointerEvents="none"
          style={{
            flex: 1,
            height: PLACE_DETAIL_TOGGLE_PILL_HEIGHT,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {photoUrls.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === photoIndex ? 8 : 6,
                height: index === photoIndex ? 8 : 6,
                borderRadius: 4,
                backgroundColor: index === photoIndex ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

        {heroMode === 'photos' ? (
          <MapModeThumb
            mapboxAccessToken={mapboxAccessToken}
            listingLngLat={listingLngLat}
            mapStyleURL={mapStyleURL}
            onPress={onToggleToMap}
            accessibilityLabel={showMapAccessibilityLabel}
          />
        ) : thumbPhotoUrl ? (
          <PressableFeedback onPress={onToggleToPhotos} accessibilityLabel={showPhotosLabel}>
            <Image
              source={{ uri: thumbPhotoUrl }}
              style={{
                width: PLACE_DETAIL_MAP_THUMB_SIZE,
                height: PLACE_DETAIL_MAP_THUMB_SIZE,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff',
              }}
              resizeMode="cover"
            />
          </PressableFeedback>
        ) : (
          <PressableFeedback onPress={onToggleToPhotos} accessibilityLabel={showPhotosLabel}>
            <ThumbFallback icon="images-outline" />
          </PressableFeedback>
        )}
    </View>
  );
}

function HeroPlaceholder({
  heroHeight,
  icon,
}: {
  heroHeight: number;
  icon: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View
      style={{
        width: '100%',
        height: heroHeight,
        backgroundColor: PLACE_DETAIL_HERO_PLACEHOLDER,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={56} color="rgba(255,255,255,0.35)" />
    </View>
  );
}

function HeroOverlayPill({
  children,
  opacity = 1,
}: {
  children: ReactNode;
  opacity?: number;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 12,
        height: PLACE_DETAIL_TOGGLE_PILL_HEIGHT,
        borderRadius: PLACE_DETAIL_TOGGLE_PILL_HEIGHT / 2,
        opacity,
      }}
    >
      {children}
    </View>
  );
}

function ThumbFallback({ icon }: { icon: ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View
      style={{
        width: PLACE_DETAIL_MAP_THUMB_SIZE,
        height: PLACE_DETAIL_MAP_THUMB_SIZE,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: PLACE_DETAIL_CTA_SECONDARY,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={28} color={PLACE_DETAIL_TEXT_MUTED} />
    </View>
  );
}

function MapModeThumb({
  mapboxAccessToken,
  listingLngLat,
  mapStyleURL,
  onPress,
  accessibilityLabel,
}: {
  mapboxAccessToken: string | undefined;
  listingLngLat: [number, number] | null;
  mapStyleURL: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  if (!listingLngLat) {
    return null;
  }

  if (!mapboxAccessToken) {
    return (
      <PressableFeedback onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <ThumbFallback icon="map-outline" />
      </PressableFeedback>
    );
  }

  return (
    <PressableFeedback onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <View
        style={{
          width: PLACE_DETAIL_MAP_THUMB_SIZE,
          height: PLACE_DETAIL_MAP_THUMB_SIZE,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: '#fff',
        }}
      >
        <Mapbox.MapView
          key="thumb-map"
          style={{ flex: 1 }}
          styleURL={mapStyleURL}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}
          pointerEvents="none"
        >
          <Mapbox.Camera
            defaultSettings={{
              centerCoordinate: listingLngLat,
              zoomLevel: 12,
            }}
          />
          <Mapbox.PointAnnotation id="thumb-listing" coordinate={listingLngLat}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PLACE_DETAIL_ACCENT }} />
          </Mapbox.PointAnnotation>
        </Mapbox.MapView>
      </View>
    </PressableFeedback>
  );
}
