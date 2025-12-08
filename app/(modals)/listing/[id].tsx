import { Ionicons } from '@expo/vector-icons';
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
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Dimensions, Image, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import Loader from '~/components/Loader';
import Avatar from '~/components/review/atom/Avatar';
import RatingScreen from '~/components/review/organisms/RatingScreen';
import RatingSummary from '~/components/review/organisms/RatingSummary';
import ReviewsScreen from '~/components/review/organisms/ReviewsScreen';
import Colors from '~/constants/Colors';
import { payloadClient } from '~/lib/api/PayloadClient';
import {
  PictureStatus,
  useFavorites,
  useListing,
  useListingPhotos,
  useRequestListingPhoto,
  useReviews,
  useToggleFavorite,
} from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';
import { sqliteManager } from '~/lib/storage/SQLiteManager';
import { getCategoryColor, getCategoryDisplayName } from '~/lib/utils/categoryHelpers';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

const defaultImage = require('~/assets/images/default-placeholder.png');

const FACILITY_INFO: Record<string, { label: string; icon: string }> = {
  '24_7_access': { label: '24/7 Toegang', icon: 'time-outline' },
  'wheelchair_accessible': { label: 'Rolstoeltoegankelijk', icon: 'accessibility-outline' },
  'parking': { label: 'Parkeren mogelijk', icon: 'car-outline' },
  'indoor': { label: 'Binnenlocatie', icon: 'home-outline' },
  'outdoor': { label: 'Buitenlocatie', icon: 'leaf-outline' },
  'sheltered': { label: 'Beschut', icon: 'shield-outline' },
  'lighting': { label: 'Verlichting', icon: 'bulb-outline' },
  'security_camera': { label: 'Beveiligingscamera', icon: 'videocam-outline' },
  'contact_required': { label: 'Contact vereist', icon: 'call-outline' },
  'free_access': { label: 'Gratis toegang', icon: 'cash-outline' },
  'membership_required': { label: 'Lidmaatschap vereist', icon: 'card-outline' },
};

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
  const { data: pendingPhotos = [] } = useListingPhotos(id ?? null, 'pending');
  const { data: favoritesData = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const requestListingPhoto = useRequestListingPhoto();

  const [listing, setListing] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [hasQueuedPhoto, setHasQueuedPhoto] = useState(false);

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

  // Sync favorite state from useFavorites hook (real-time updates)
  useEffect(() => {
    console.log('[ListingDetails] Syncing favorite state from useFavorites', { 
      user: !!user?.id, 
      id, 
      favoritesCount: favoritesData.length 
    });
    
    if (!user?.id || !id) {
      console.log('[ListingDetails] No user or id, setting isFavorite to false');
      setIsFavorite(false);
      return;
    }

    // Check if listing is in favorites from the query data
    const isInFavorites = favoritesData.some((fav: any) => {
      const favListingId =
        typeof fav.listing === 'string' ? fav.listing : fav.listing?.id ?? fav.listing_id;
      return favListingId === id;
    });

    console.log('[ListingDetails] Setting isFavorite', { isInFavorites, listingId: id });
    setIsFavorite(isInFavorites);
  }, [favoritesData, user?.id, id]);

  // Fallback: sync from SQLite on mount (for offline-first support)
  useEffect(() => {
    const syncFavoriteStateFromSQLite = async () => {
      if (user?.id && id && favoritesData.length === 0) {
        console.log('[ListingDetails] Syncing from SQLite fallback', { userId: user.id, listingId: id });
        try {
          const favorites = await sqliteManager.getFavorites(user.id);
          const isInSQLite = favorites.some((fav: any) => fav.listing_id === id);
          console.log('[ListingDetails] SQLite sync result', { isInSQLite, favoritesCount: favorites.length });
          setIsFavorite(isInSQLite);
        } catch (error) {
          console.warn('[ListingDetails] Failed to load favorites from SQLite', error);
        }
      }
    };

    syncFavoriteStateFromSQLite();
  }, [user?.id, id, favoritesData.length]);

  // Check for queued photos
  useEffect(() => {
    const checkQueuedPhotos = async () => {
      if (id) {
        try {
          const localListing = await sqliteManager.getListingById(id);
          if (localListing?.pictures) {
            const hasQueued = localListing.pictures.some((pic: any) => pic.status === 'queued');
            setHasQueuedPhoto(hasQueued);
          }
        } catch (error) {
          console.warn('[ListingDetails] Failed to check queued photos', error);
        }
      }
    };

    checkQueuedPhotos();
  }, [id, listing]);

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
    console.log('[ListingDetails] handleToggleFavorite called', { user: !!user, id, isFavorite });
    
    if (!user || !id) {
      console.warn('[ListingDetails] Cannot toggle favorite - missing user or id', { user: !!user, id });
      Alert.alert('Inloggen vereist', 'Log in om favorieten op te slaan.');
      return;
    }

    console.log('[ListingDetails] Calling toggleFavorite.mutateAsync', { listingId: id, isFavorite });
    
    try {
      await toggleFavorite.mutateAsync({ listingId: id, isFavorite });
      console.log('[ListingDetails] toggleFavorite.mutateAsync succeeded');
      // State will be updated automatically via useFavorites hook when query invalidates
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

      // Check if we're online or offline
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        Alert.alert('Bedankt!', 'Je foto is ingestuurd en wacht op goedkeuring van de beheerder.');
      } else {
        Alert.alert(
          'Foto opgeslagen! 📱',
          'Je foto is lokaal opgeslagen en wordt automatisch geüpload zodra je weer online bent. Dan wacht het op goedkeuring van de beheerder.'
        );
        // Trigger check for queued photos
        setHasQueuedPhoto(true);
      }
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

  const CarouselItem = useCallback(({ photo }: { photo: any }) => {
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
  }, []);

  const hasPhotos = approvedPhotos.length > 0;
  const categoryLabel = listing?.category
    ? getCategoryDisplayName(listing.category)
    : 'Onbekend';

  const categoryColor = listing?.category
    ? getCategoryColor(listing.category)
    : Colors.border.light;

  return (
    <Box flex={1} bg={Colors.background.primary}>
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
            <Image
              source={defaultImage}
              style={{ width: '100%', height: IMG_HEIGHT }}
              resizeMode="cover"
            />
          )}

          {user && (
            <TouchableOpacity
              style={[styles.addPhotoButton, (isUploadingPhoto || hasQueuedPhoto) && styles.addPhotoButtonDisabled]}
              onPress={handleAddPhoto}
              disabled={isUploadingPhoto || hasQueuedPhoto}>
              <Text style={styles.addPhotoButtonText}>
                {isUploadingPhoto
                  ? 'Uploaden...'
                  : hasQueuedPhoto
                  ? 'Foto in wachtrij'
                  : 'Voeg een foto toe'}
              </Text>
            </TouchableOpacity>
          )}

          <VStack space="lg" p="$4">
            <VStack space="xs">
              <Heading size="xl">{listing.name}</Heading>
              <HStack space="xs" alignItems="center">
                <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
                <Text size="sm" color={Colors.text.secondary}>
                  {listing.location?.address || 'Onbekend adres'}
                </Text>
              </HStack>
              {listing.distance && (
                <Text size="sm" color={Colors.text.secondary}>
                  📍 {listing.distance} km verwijderd
                </Text>
              )}
              {listing.category && (
                <Badge
                  variant="solid"
                  bg={categoryColor}
                  size="md"
                  mt="$2"
                  alignSelf="flex-start">
                  <BadgeText color={Colors.white}>{categoryLabel}</BadgeText>
                </Badge>
              )}
            </VStack>

            <Divider />

            {listing.description && (
              <VStack space="xs">
              <Heading size="sm">Over deze locatie</Heading>
              <Text size="sm" color={Colors.text.tertiary} lineHeight="$lg">
                  {listing.description}
                </Text>
              </VStack>
            )}

            <Divider />

            {/* Opening Hours */}
            {listing.facilities?.openingHours && (
              <VStack space="xs">
                <Heading size="sm">🕐 Openingstijden</Heading>
                <Text size="sm" color={Colors.text.tertiary} lineHeight="$lg">
                  {listing.facilities.openingHours}
                </Text>
              </VStack>
            )}

            {/* Facilities */}
            {listing.facilities?.facilities && listing.facilities.facilities.length > 0 && (
              <VStack space="xs">
                <Heading size="sm">🏢 Voorzieningen</Heading>
                <View style={styles.facilitiesContainer}>
                  {listing.facilities.facilities.map((facilityItem: any, index: number) => {
                    const facility = facilityItem.facility;
                    const facilityInfo = FACILITY_INFO[facility];
                    return (
                      <View key={index} style={styles.facilityItem}>
                        <Ionicons
                          name={facilityInfo?.icon as any}
                          size={16}
                          color={Colors.text.tertiary}
                        />
                        <Text style={styles.facilityText}>{facilityInfo?.label || facility}</Text>
                      </View>
                    );
                  })}
                </View>
              </VStack>
            )}

            {/* House Rules */}
            {listing.facilities?.rules && (
              <VStack space="xs">
                <Heading size="sm">📋 Huisregels</Heading>
                <Text size="sm" color={Colors.text.tertiary} lineHeight="$lg">
                  {listing.facilities.rules}
                </Text>
              </VStack>
            )}

            {/* Contact Info */}
            {listing.facilities?.contactInfo && (
              <VStack space="xs">
                <Heading size="sm">📞 Contact</Heading>
                <Text size="sm" color={Colors.text.tertiary} lineHeight="$lg">
                  {listing.facilities.contactInfo}
                </Text>
              </VStack>
            )}

            {(listing.facilities?.openingHours || listing.facilities?.facilities?.length > 0 ||
              listing.facilities?.rules || listing.facilities?.contactInfo) && (
              <Divider />
            )}

            <VStack space="md">
              <RatingSummary reviews={listing.reviews || []} />
            </VStack>

            <Divider />

            {user ? (
              <VStack space="md">
                <Heading size="md">Beoordeel deze locatie</Heading>
                <Box bg={Colors.background.secondary} p="$4" borderRadius="$lg">
                  <HStack space="md" alignItems="center">
                    <Avatar name={user.email?.[0]?.toUpperCase() || 'A'} uri={null} />
                    <VStack flex={1} space="xs">
                      <Text size="sm" fontWeight="$semibold" color={Colors.text.primary}>
                        {user.email || 'Jij'}
                      </Text>
                      <RatingScreen setRating={setRating} rating={rating} />
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            ) : (
                <Box
                  bg={Colors.background.secondary}
                  p="$5"
                  borderRadius="$lg"
                  alignItems="center"
                  borderWidth={1}
                  borderColor={Colors.border.light}>
                <Text
                  size="sm"
                  color={Colors.primary}
                  textAlign="center"
                  mb="$2"
                  fontWeight="$semibold">
                  Log in om te beoordelen en te reviewen
                </Text>
                <Text size="xs" color={Colors.text.secondary} textAlign="center">
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
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => {
            console.log('[TopBarButtons] Favorite button pressed', { isFavorite, canFavorite });
            onToggleFavorite();
          }}
          activeOpacity={0.7}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? Colors.error : Colors.text.primary}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.roundButton} onPress={onShare} activeOpacity={0.7}>
        <Ionicons name="share-outline" size={22} color={Colors.text.primary} />
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
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
  },
  addPhotoButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(15, 13, 8, 0.85)',
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
    color: Colors.white,
    fontWeight: '600',
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  facilityText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
});
