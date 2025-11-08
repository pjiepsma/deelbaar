import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Share,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {
  Badge,
  BadgeText,
  Box,
  Divider,
  Heading,
  HStack,
  ScrollView,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import * as ImagePicker from 'expo-image-picker';

import Loader from '~/components/Loader';
import Avatar from '~/components/review/atom/Avatar';
import RatingScreen from '~/components/review/organisms/RatingScreen';
import RatingSummary from '~/components/review/organisms/RatingSummary';
import ReviewsScreen from '~/components/review/organisms/ReviewsScreen';
import Colors from '~/constants/Colors';
import {
  PictureStatus,
  useListing,
  useListingPhotos,
  useRequestListingPhoto,
  useReviews,
  useToggleFavorite,
} from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';
import { sqliteManager } from '~/lib/storage/SQLiteManager';
import { payloadClient } from '~/lib/api/PayloadClient';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

const defaultImage = require('~/assets/images/default-placeholder.png');

type ListingParams = {
  id: string;
  dist_meters?: string;
  lat?: string;
  long?: string;
};

type PictureRecord = {
  id: string;
  photo: any;
  created_by?: any;
  status?: PictureStatus;
  createdAt?: string;
};

export default function ListingDetailsModal() {
  const { id, dist_meters, lat, long } = useLocalSearchParams<ListingParams>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();

  const { data: listingData } = useListing(id);
  const { data: reviewsData } = useReviews(id);
  const { data: approvedPhotos = [] } = useListingPhotos(id ?? null, 'approved');
  const toggleFavorite = useToggleFavorite();
  const requestListingPhoto = useRequestListingPhoto();

  const [listing, setListing] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!listingData) return;

    const distanceKm = dist_meters ? (Number(dist_meters) / 1000).toFixed(1) : undefined;
    setListing({
      ...listingData,
      distance: distanceKm,
      lat: lat ? Number(lat) : undefined,
      long: long ? Number(long) : undefined,
      reviews: reviewsData ?? listingData.reviews ?? [],
    });
  }, [listingData, reviewsData, dist_meters, lat, long]);

  useEffect(() => {
    const syncFavoriteState = async () => {
      if (user?.id && id) {
        try {
          const favorites = await sqliteManager.getFavorites(user.id);
          setIsFavorite(favorites.some((fav: any) => fav.listing_id === id));
        } catch (error) {
          console.warn('[ListingDetails] Failed to load favorites from SQLite', error);
        }
      } else {
        setIsFavorite(false);
      }
    };

    syncFavoriteState();
  }, [user?.id, id]);

  useFocusEffect(
    useCallback(() => {
      setRating(0);
    }, [])
  );

  useEffect(() => {
    if (!rating || !listing || !user) {
      return;
    }

    router.push({
      pathname: '/(modals)/review',
      params: {
        id,
        title: listing.name ?? 'Listing',
        name: user.email || 'User',
        rating: rating.toString(),
        profile: JSON.stringify(user),
      },
    });
  }, [rating, listing, user, id, router]);

  const handleToggleFavorite = useCallback(async () => {
    if (!user || !id) {
      Alert.alert('Inloggen vereist', 'Log in om favorieten op te slaan.');
      return;
    }

    try {
      await toggleFavorite.mutateAsync({ listingId: id, isFavorite });
      setIsFavorite((current) => !current);
    } catch (error) {
      console.error('[ListingDetails] Toggle favorite failed', error);
      Alert.alert('Fout', 'Kon favoriet niet bijwerken.');
    }
  }, [id, isFavorite, toggleFavorite, user]);

  const handleShare = useCallback(async () => {
    if (!listing) return;

    try {
      await Share.share({
        message: `Bekijk ${listing.name ?? 'deze locatie'} op Deelbaar!`,
      });
    } catch (error) {
      console.warn('[ListingDetails] Share failed', error);
    }
  }, [listing]);

  const handleAddPhoto = useCallback(async () => {
    if (!user) {
      Alert.alert('Log in nodig', 'Meld je aan om een foto in te dienen.');
      return;
    }

    try {
      const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert('Toestemming vereist', 'Geef toegang tot je foto’s om verder te gaan.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length || !id) {
        return;
      }

      const asset = result.assets[0];
      const filename =
        asset.fileName ??
        asset.uri.split('/').pop() ??
        `listing-photo-${Date.now()}.${asset.mimeType?.split('/')[1] || 'jpg'}`;
      const mimeType = asset.mimeType || 'image/jpeg';

      setIsUploadingPhoto(true);
      await requestListingPhoto.mutateAsync({
        listingId: id,
        file: {
          uri: asset.uri,
          type: mimeType,
          name: filename,
        },
      });

      Alert.alert(
        'Bedankt!',
        'Je foto is ingestuurd en wacht op goedkeuring van de beheerder.'
      );
    } catch (error: any) {
      Alert.alert('Upload mislukt', error.message || 'Kon de foto niet uploaden.');
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [id, requestListingPhoto, user]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerTransparent: true,
      headerRight: () => (
        <TopBarButtons
          canFavorite={Boolean(user)}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onShare={handleShare}
        />
      ),
      headerLeft: () => (
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, user, isFavorite, handleToggleFavorite, handleShare]);

  const CarouselItem = useCallback(
    ({ photo }: { photo: any }) => {
      const mediaId = typeof photo?.photo === 'string' ? photo.photo : photo.photo?.id;
      const uri = mediaId ? payloadClient.getFileUrl(mediaId) : null;

      return (
        <VStack style={styles.carouselItemContainer}>
          <Image
            key={mediaId || 'default-image'}
            source={uri ? { uri } : defaultImage}
            style={styles.image}
            resizeMode="cover"
          />
        </VStack>
      );
    },
    []
  );

  const hasPhotos = approvedPhotos.length > 0;

  return (
    <Box flex={1} bg="$white">
      {!listing ? (
        <Loader delay={200} amount={3} visible />
      ) : (
        <ScrollView>
          {hasPhotos ? (
            <Box position="relative">
              <Carousel
                width={width}
                height={IMG_HEIGHT}
                data={approvedPhotos}
                loop={false}
                ref={(_ref: ICarouselInstance | null) => {
                  // keep reference if needed later
                }}
                onSnapToItem={(index: number) => setSelectedIndex(index)}
                renderItem={({ item }) => <CarouselItem photo={item} />}
              />
              <Box
                position="absolute"
                bottom={16}
                right={16}
                bg="rgba(0, 0, 0, 0.6)"
                px="$3"
                py="$1.5"
                borderRadius="$full">
                <Text size="sm" color="$white" fontWeight="$semibold">
                  {selectedIndex + 1} / {approvedPhotos.length}
                </Text>
              </Box>
            </Box>
          ) : (
            <Image source={defaultImage} style={{ width: '100%', height: IMG_HEIGHT }} resizeMode="cover" />
          )}

          {user && (
            <TouchableOpacity
              style={[styles.addPhotoButton, isUploadingPhoto && styles.addPhotoButtonDisabled]}
              onPress={handleAddPhoto}
              disabled={isUploadingPhoto}>
              <Text style={styles.addPhotoButtonText}>
                {isUploadingPhoto ? 'Uploaden...' : 'Voeg een foto toe'}
              </Text>
            </TouchableOpacity>
          )}

          <VStack space="lg" p="$4">
            <VStack space="xs">
              <Heading size="xl">{listing.name}</Heading>
              <HStack space="xs" alignItems="center">
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text size="sm" color="$coolGray600">
                  {listing.location?.address || 'Onbekend adres'}
                </Text>
              </HStack>
              {listing.distance && (
                <Text size="sm" color="$coolGray500">
                  📍 {listing.distance} km verwijderd
                </Text>
              )}
              {listing.category && (
                <Badge variant="solid" bg="#6B8E23" size="md" mt="$2" alignSelf="flex-start">
                  <BadgeText color="$white">{listing.category}</BadgeText>
                </Badge>
              )}
            </VStack>

            <Divider />

            {listing.description && (
              <VStack space="xs">
                <Heading size="sm">Over deze locatie</Heading>
                <Text size="sm" color="$coolGray700" lineHeight="$lg">
                  {listing.description}
                </Text>
              </VStack>
            )}

            <Divider />

            <VStack space="md">
              <RatingSummary reviews={listing.reviews || []} />
            </VStack>

            <Divider />

            {user ? (
              <VStack space="md">
                <Heading size="md">Beoordeel deze locatie</Heading>
                <Box bg="$coolGray50" p="$4" borderRadius="$lg">
                  <HStack space="md" alignItems="center">
                    <Avatar name={user.email?.[0]?.toUpperCase() || 'A'} uri={null} />
                    <VStack flex={1} space="xs">
                      <Text size="sm" fontWeight="$semibold" color="$gray900">
                        {user.email || 'Jij'}
                      </Text>
                      <RatingScreen setRating={setRating} rating={rating} />
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            ) : (
              <Box
                bg="#F5F5DC"
                p="$5"
                borderRadius="$lg"
                alignItems="center"
                borderWidth={1}
                borderColor="#E8E8D0">
                <Text size="sm" color="#6B8E23" textAlign="center" mb="$2" fontWeight="$semibold">
                  🔒 Log in om te beoordelen en te reviewen
                </Text>
                <Text size="xs" color="$coolGray600" textAlign="center">
                  Deel jouw ervaring met de community.
                </Text>
              </Box>
            )}

            <Divider />

            <VStack space="md">
              <Heading size="sm">Reviews</Heading>
              <ReviewsScreen reviews={listing.reviews || []} images={listing.images || []} />
            </VStack>
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}

function TopBarButtons({
  canFavorite,
  isFavorite,
  onToggleFavorite,
  onShare,
}: {
  canFavorite: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}) {
  return (
    <HStack space="sm" alignItems="center">
      {canFavorite && (
        <TouchableOpacity style={styles.roundButton} onPress={onToggleFavorite} activeOpacity={0.7}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? '#FF385C' : '#000'}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.roundButton} onPress={onShare} activeOpacity={0.7}>
        <Ionicons name="share-outline" size={22} color="#000" />
      </TouchableOpacity>
    </HStack>
  );
}

const styles = StyleSheet.create({
  carouselItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: IMG_HEIGHT,
    width,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addPhotoButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#00000099',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: -48,
    marginRight: 16,
  },
  addPhotoButtonDisabled: {
    opacity: 0.6,
  },
  addPhotoButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});


