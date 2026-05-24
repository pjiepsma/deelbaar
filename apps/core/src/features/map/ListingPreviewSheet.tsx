import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { BottomSheet, Button, useThemeColor } from 'heroui-native';
import { Alert, Image, ScrollView, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { navigateToAuthModal, navigateToListingDetail } from '../../navigation/rootNavigation';
import { mapPayloadListingToMapCard } from './mapListing.mapper';
import type { MapPlaceRecord } from './map.types';

const DESCRIPTION_PREVIEW_MAX = 480;

type Props = {
  place: MapPlaceRecord | null;
  serverOrigin: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navigation: NavigationProp<ParamListBase>;
};

function previewDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length <= DESCRIPTION_PREVIEW_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, DESCRIPTION_PREVIEW_MAX).trimEnd()}…`;
}

export function ListingPreviewSheet({ place, serverOrigin, open, onOpenChange, navigation }: Props) {
  const { user } = useAuth();
  const { referenceLngLat } = useDiscoveryArea();
  const muted = useThemeColor('muted');
  const card = place && serverOrigin ? mapPayloadListingToMapCard(place, serverOrigin, referenceLngLat) : null;

  const interaction = place?.interaction;
  const canOpenDetails = !!interaction?.canOpenDetails;
  const canFavorite = !!interaction?.canFavorite;
  const canFollow = !!interaction?.canFollow;
  const canNotify = !!interaction?.canReceiveNotifications;

  const requireAuthForAction = (): void => {
    onOpenChange(false);
    navigateToAuthModal(navigation);
  };

  const onProtectedAction = (allowed: boolean): void => {
    if (!user) {
      requireAuthForAction();
      return;
    }
    if (!allowed) {
      onOpenChange(false);
      return;
    }
    Alert.alert('Coming soon', 'This action will be available in a future update.');
  };

  const openFullDetails = (): void => {
    if (!place || typeof place.id !== 'number') {
      return;
    }
    if (!user) {
      requireAuthForAction();
      return;
    }
    if (!canOpenDetails) {
      Alert.alert(
        'Details unavailable',
        'Full listing details are not available for this place with your current map access.',
      );
      return;
    }
    onOpenChange(false);
    navigateToListingDetail(navigation, { collection: place.mapPlaceCollection, id: place.id });
  };

  return (
    <BottomSheet isOpen={open} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={['45%', '88%']}>
          <BottomSheet.Close className="self-end" />
          <ScrollView className="max-h-[80%] px-1" showsVerticalScrollIndicator={false}>
            <View className="mb-3 items-center">
              <BottomSheet.Title className="text-center">Preview</BottomSheet.Title>
              <BottomSheet.Description className="text-center">
                Sign in to open the full listing, save favorites, follow, and manage notifications.
              </BottomSheet.Description>
            </View>

            {!card || !place ? null : (
              <>
                {card.imageUrl ? (
                  <Image
                    source={{ uri: card.imageUrl }}
                    style={{ width: '100%', height: 180, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: '100%', height: 180, borderRadius: 12, backgroundColor: muted }} />
                )}
                <Text className="text-foreground mt-3 text-xl font-semibold">{card.title}</Text>
                <Text className="text-muted mt-1 text-sm">{card.kindLabel}</Text>
                {card.distanceKm !== undefined ? (
                  <Text className="text-muted mt-1 text-sm">{card.distanceKm.toFixed(1)} km away</Text>
                ) : null}
                {card.rating !== undefined && card.reviews !== undefined ? (
                  <Text className="text-muted mt-1 text-sm">
                    {card.rating.toFixed(1)} ({card.reviews} reviews)
                  </Text>
                ) : null}
                <Text className="text-foreground mt-4 text-base leading-6">{previewDescription(place.description)}</Text>

                <View className="mt-5 flex-row flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={!!user && !canFavorite}
                    onPress={() => onProtectedAction(canFavorite)}
                  >
                    <Button.Label>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name={card.loved ? 'heart' : 'heart-outline'} size={18} />
                        <Text className="text-foreground">Save</Text>
                      </View>
                    </Button.Label>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={!!user && !canFollow}
                    onPress={() => onProtectedAction(canFollow)}
                  >
                    <Button.Label>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="people-outline" size={18} />
                        <Text className="text-foreground">Follow</Text>
                      </View>
                    </Button.Label>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={!!user && !canNotify}
                    onPress={() => onProtectedAction(canNotify)}
                  >
                    <Button.Label>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="notifications-outline" size={18} />
                        <Text className="text-foreground">Alerts</Text>
                      </View>
                    </Button.Label>
                  </Button>
                </View>

                <View className="mt-6 gap-2">
                  <Button variant="primary" onPress={openFullDetails}>
                    <Button.Label>{user ? (canOpenDetails ? 'Open full listing' : 'Full listing locked') : 'Sign in for full listing'}</Button.Label>
                  </Button>
                  <Button variant="tertiary" onPress={() => onOpenChange(false)}>
                    <Button.Label>Close</Button.Label>
                  </Button>
                </View>
              </>
            )}
          </ScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
