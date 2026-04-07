import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, Separator, ScrollView } from 'tamagui';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView as RNScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';

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
import { analyzeBookshelf, isTextRecognitionAvailable } from '~/lib/ai';
import type { BookDetection } from '~/lib/ai';
import { getCategoryColor, getCategoryDisplayName } from '~/lib/utils/categoryHelpers';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

const defaultImage = require('~/assets/images/default-placeholder.png');

const FACILITY_INFO: Record<string, { label: string; icon: string }> = {
  '24_7_access': { label: '24/7 Toegang', icon: 'time-outline' },
  wheelchair_accessible: { label: 'Rolstoeltoegankelijk', icon: 'accessibility-outline' },
  parking: { label: 'Parkeren mogelijk', icon: 'car-outline' },
  indoor: { label: 'Binnenlocatie', icon: 'home-outline' },
  outdoor: { label: 'Buitenlocatie', icon: 'leaf-outline' },
  sheltered: { label: 'Beschut', icon: 'shield-outline' },
  lighting: { label: 'Verlichting', icon: 'bulb-outline' },
  security_camera: { label: 'Beveiligingscamera', icon: 'videocam-outline' },
  contact_required: { label: 'Contact vereist', icon: 'call-outline' },
  free_access: { label: 'Gratis toegang', icon: 'cash-outline' },
  membership_required: { label: 'Lidmaatschap vereist', icon: 'card-outline' },
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
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBooks, setScannedBooks] = useState<BookDetection[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);
  const [CarouselComponent, setCarouselComponent] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null);

  useEffect(() => {
    import('react-native-reanimated-carousel').then((m) => setCarouselComponent(() => m.default));
  }, []);

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
      favoritesCount: favoritesData.length,
    });

    if (!user?.id || !id) {
      console.log('[ListingDetails] No user or id, setting isFavorite to false');
      setIsFavorite(false);
      return;
    }

    // Check if listing is in favorites from the query data
    const isInFavorites = favoritesData.some((fav: any) => {
      const favListingId =
        typeof fav.listing === 'string' ? fav.listing : (fav.listing?.id ?? fav.listing_id);
      return favListingId === id;
    });

    console.log('[ListingDetails] Setting isFavorite', { isInFavorites, listingId: id });
    setIsFavorite(isInFavorites);
  }, [favoritesData, user?.id, id]);

  // Fallback: sync from SQLite on mount (for offline-first support)
  useEffect(() => {
    const syncFavoriteStateFromSQLite = async () => {
      if (user?.id && id && favoritesData.length === 0) {
        console.log('[ListingDetails] Syncing from SQLite fallback', {
          userId: user.id,
          listingId: id,
        });
        try {
          const favorites = await sqliteManager.getFavorites(user.id);
          const isInSQLite = favorites.some((fav: any) => fav.listing_id === id);
          console.log('[ListingDetails] SQLite sync result', {
            isInSQLite,
            favoritesCount: favorites.length,
          });
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
      console.warn('[ListingDetails] Cannot toggle favorite - missing user or id', {
        user: !!user,
        id,
      });
      Alert.alert('Inloggen vereist', 'Log in om favorieten op te slaan.');
      return;
    }

    console.log('[ListingDetails] Calling toggleFavorite.mutateAsync', {
      listingId: id,
      isFavorite,
    });

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

  const handleScanLibrary = useCallback(async () => {
    if (!isTextRecognitionAvailable()) {
      Alert.alert(
        'Niet beschikbaar',
        'Boekherkenning werkt alleen op een telefoon. Voer "expo prebuild" uit als developer.'
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Toestemming vereist',
          'Geef toegang tot de camera om de boekenkast te scannen.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        console.log('[ListingDetails] Scan cancelled or no URI');
        return;
      }

      console.log('[ListingDetails] Calling analyzeBookshelf', result.assets[0].uri?.slice(0, 50));
      setIsScanning(true);
      const detections = await analyzeBookshelf(result.assets[0].uri, (done, total) => {
        console.log('[ListingDetails] Scan progress', { done, total });
      });
      console.log('[ListingDetails] analyzeBookshelf DONE', {
        count: detections.length,
        titles: detections.map((d) => d.title),
      });

      if (detections.length === 0) {
        Alert.alert(
          'Geen boeken gevonden',
          'Er werden geen geverifieerde boektitels gevonden. Probeer een duidelijke foto van boekruggen.'
        );
        return;
      }

      console.log('[ListingDetails] scannedBooks', detections);
      setScannedBooks(detections);
      setShowScanResults(true);
    } catch (error: any) {
      console.log('[ListingDetails] Scan error:', error);
      Alert.alert('Scan mislukt', error?.message || 'Kon de foto niet analyseren.');
    } finally {
      setIsScanning(false);
    }
  }, []);

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
      <YStack style={styles.carouselItemContainer}>
        <Image
          key={mediaId || 'default-image'}
          source={uri ? { uri } : defaultImage}
          style={styles.image}
          resizeMode="cover"
        />
      </YStack>
    );
  }, []);

  const hasPhotos = approvedPhotos.length > 0;
  const categoryLabel = listing?.category ? getCategoryDisplayName(listing.category) : 'Onbekend';

  const categoryColor = listing?.category
    ? getCategoryColor(listing.category)
    : Colors.border.light;

  return (
    <YStack flex={1} backgroundColor={Colors.background.primary}>
      {!listing ? (
        <Loader delay={200} amount={3} visible />
      ) : (
        <ScrollView>
          <View style={styles.imageSection}>
            {hasPhotos ? (
              <>
                {CarouselComponent ? (
                  <CarouselComponent
                    width={width}
                    height={IMG_HEIGHT}
                    data={approvedPhotos}
                    loop={false}
                    ref={(_ref: ICarouselInstance | null) => {}}
                    onSnapToItem={(index: number) => setSelectedIndex(index)}
                    renderItem={({ item }: { item: unknown }) => <CarouselItem photo={item} />}
                  />
                ) : (
                  <View style={{ height: IMG_HEIGHT, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" />
                  </View>
                )}
                <YStack
                  position="absolute"
                  bottom={16}
                  right={16}
                  backgroundColor="rgba(0, 0, 0, 0.6)"
                  paddingHorizontal={12}
                  paddingVertical={6}
                  borderRadius={999}>
                  <Text fontSize={14} color="white" fontWeight="600">
                    {selectedIndex + 1} / {approvedPhotos.length}
                  </Text>
                </YStack>
              </>
            ) : (
              <Image
                source={defaultImage}
                style={{ width: '100%', height: IMG_HEIGHT }}
                resizeMode="cover"
              />
            )}

            <View style={styles.imageActions}>
              {isTextRecognitionAvailable() && (
                <TouchableOpacity
                  style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                  onPress={handleScanLibrary}
                  disabled={isScanning}>
                  {isScanning ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="scan" size={18} color="#fff" />
                      <Text style={styles.scanButtonText}>Scan de bibliotheek</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              {user && (
                <TouchableOpacity
                  style={[
                    styles.addPhotoButton,
                    (isUploadingPhoto || hasQueuedPhoto) && styles.addPhotoButtonDisabled,
                  ]}
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
            </View>
          </View>

          {isTextRecognitionAvailable() && (
            <Text style={styles.scanHint}>
              Tip: horizontaal voor horizontale ruggen; voor verticale tekst draai je telefoon 90°
            </Text>
          )}

          <Modal
            visible={showScanResults}
            animationType="slide"
            transparent
            onRequestClose={() => setShowScanResults(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.scanResultsModal}>
                <View style={styles.scanResultsHeader}>
                  <Text style={styles.scanResultsTitle}>
                    Boeken gevonden ({scannedBooks.length})
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowScanResults(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                </View>
                <RNScrollView style={styles.scanResultsList} showsVerticalScrollIndicator={false}>
                  {scannedBooks.map((book) => (
                    <View key={book.id} style={styles.scanResultItem}>
                      <Ionicons name="book-outline" size={18} color={Colors.text.secondary} />
                      <YStack flex={1}>
                        <Text style={styles.scanResultTitle}>{book.title}</Text>
                        {book.author && <Text style={styles.scanResultAuthor}>{book.author}</Text>}
                      </YStack>
                    </View>
                  ))}
                </RNScrollView>
              </View>
            </View>
          </Modal>

          <YStack gap={24} padding={16}>
            <YStack gap={8}>
              <Text fontSize={24} fontWeight="700">
                {listing.name}
              </Text>
              <XStack gap={8} alignItems="center">
                <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
                <Text fontSize={14} color={Colors.text.secondary}>
                  {listing.location?.address || 'Onbekend adres'}
                </Text>
              </XStack>
              {listing.distance && (
                <Text fontSize={14} color={Colors.text.secondary}>
                  📍 {listing.distance} km verwijderd
                </Text>
              )}
              {listing.category && (
                <XStack
                  backgroundColor={categoryColor}
                  paddingHorizontal={10}
                  paddingVertical={6}
                  borderRadius={8}
                  marginTop={8}
                  alignSelf="flex-start">
                  <Text color="white">{categoryLabel}</Text>
                </XStack>
              )}
            </YStack>

            <Separator />

            {listing.description && (
              <YStack gap={8}>
                <Text fontSize={16} fontWeight="600">
                  Over deze locatie
                </Text>
                <Text fontSize={14} color={Colors.text.tertiary} lineHeight={24}>
                  {listing.description}
                </Text>
              </YStack>
            )}

            <Separator />

            {/* Opening Hours */}
            {listing.facilities?.openingHours && (
              <YStack gap={8}>
                <Text fontSize={16} fontWeight="600">
                  🕐 Openingstijden
                </Text>
                <Text fontSize={14} color={Colors.text.tertiary} lineHeight={24}>
                  {listing.facilities.openingHours}
                </Text>
              </YStack>
            )}

            {/* Facilities */}
            {listing.facilities?.facilities && listing.facilities.facilities.length > 0 && (
              <YStack gap={8}>
                <Text fontSize={16} fontWeight="600">
                  🏢 Voorzieningen
                </Text>
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
              </YStack>
            )}

            {/* House Rules */}
            {listing.facilities?.rules && (
              <YStack gap={8}>
                <Text fontSize={16} fontWeight="600">
                  📋 Huisregels
                </Text>
                <Text fontSize={14} color={Colors.text.tertiary} lineHeight={24}>
                  {listing.facilities.rules}
                </Text>
              </YStack>
            )}

            {/* Contact Info */}
            {listing.facilities?.contactInfo && (
              <YStack gap={8}>
                <Text fontSize={16} fontWeight="600">
                  📞 Contact
                </Text>
                <Text fontSize={14} color={Colors.text.tertiary} lineHeight={24}>
                  {listing.facilities.contactInfo}
                </Text>
              </YStack>
            )}

            {(listing.facilities?.openingHours ||
              listing.facilities?.facilities?.length > 0 ||
              listing.facilities?.rules ||
              listing.facilities?.contactInfo) && <Separator />}

            <YStack gap={16}>
              <RatingSummary reviews={listing.reviews || []} />
            </YStack>

            <Separator />

            {user ? (
              <YStack gap={16}>
                <Text fontSize={18} fontWeight="600">
                  Beoordeel deze locatie
                </Text>
                <YStack
                  backgroundColor={Colors.background.secondary}
                  padding={16}
                  borderRadius={12}>
                  <XStack gap={16} alignItems="center">
                    <Avatar name={user.email?.[0]?.toUpperCase() || 'A'} uri={null} />
                    <YStack flex={1} gap={8}>
                      <Text fontSize={14} fontWeight="600" color={Colors.text.primary}>
                        {user.email || 'Jij'}
                      </Text>
                      <RatingScreen setRating={setRating} rating={rating} />
                    </YStack>
                  </XStack>
                </YStack>
              </YStack>
            ) : (
              <YStack
                backgroundColor={Colors.background.secondary}
                padding={20}
                borderRadius={12}
                alignItems="center"
                borderWidth={1}
                borderColor={Colors.border.light}>
                <Text
                  fontSize={14}
                  color={Colors.primary}
                  textAlign="center"
                  marginBottom={8}
                  fontWeight="600">
                  Log in om te beoordelen en te reviewen
                </Text>
                <Text fontSize={12} color={Colors.text.secondary} textAlign="center">
                  Deel jouw ervaring met de community.
                </Text>
              </YStack>
            )}

            <Separator />

            <YStack gap={16}>
              <Text fontSize={16} fontWeight="600">
                Reviews
              </Text>
              <ReviewsScreen reviews={listing.reviews || []} images={listing.images || []} />
            </YStack>
          </YStack>
        </ScrollView>
      )}
    </YStack>
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
    <XStack gap={8} alignItems="center">
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
    </XStack>
  );
}

const styles = StyleSheet.create({
  carouselItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSection: {
    position: 'relative',
  },
  imageActions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  addPhotoButton: {
    backgroundColor: 'rgba(15, 13, 8, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  scanResultsModal: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  scanResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  scanResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scanResultsList: {
    maxHeight: 400,
    padding: 16,
  },
  scanResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  scanResultTitle: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  scanResultAuthor: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  scanHint: {
    fontSize: 12,
    color: Colors.text.secondary,
    paddingHorizontal: 16,
    paddingTop: 8,
    fontStyle: 'italic',
  },
});
