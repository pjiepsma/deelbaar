import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/core';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import Loader from '~/components/Loader';
import Avatar from '~/components/review/atom/Avatar';
import RatingScreen from '~/components/review/organisms/RatingScreen';
import RatingSummary from '~/components/review/organisms/RatingSummary';
import ReviewsScreen from '~/components/review/organisms/ReviewsScreen';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/AuthProvider';
import { system, useSystem } from '~/lib/powersync/PowerSync';
import { SelectListing, SelectPictures, SelectReviews } from '~/lib/powersync/Queries';
import { toAttachmentRecord } from '~/lib/util/util';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

const DetailsPage = () => {
  const { id, dist_meters, lat, long } = useLocalSearchParams<{
    id: string;
    dist_meters: string;
    lat: string;
    long: string;
  }>();

  const { powersync } = useSystem();
  const defaultImage = require('~/assets/images/default-placeholder.png');
  const navigation = useNavigation();
  // const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(); // improve type
  const [rating, setRating] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      getListing(id);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setRating(null);
    }, [])
  );

  // const averageRating = useMemo(() => {
  //   if (reviews) {
  //     const totalRating = reviews.reduce((sum, { rating }) => sum + rating, 0);
  //     return (totalRating / reviews.length).toFixed(2);
  //   }
  // }, [reviews]);
  //
  // useEffect(() => {
  //   if (listing && averageRating) {
  //     const newListing: ListingRecord = {
  //       ...listing,
  //       rating: averageRating,
  //     };
  //     setListing(newListing);
  //   }
  // }, [averageRating]);

  useEffect(() => {
    if (rating !== null) {
      router.push({
        pathname: '/(modals)/review',
        params: {
          id,
          rating,
        },
      });
    }
  }, [rating]);

  const getListing = async (id: string): Promise<void> => {
    try {
      const [listingResult, imagesResult, reviewsResult] = await Promise.all([
        powersync.execute(SelectListing, [id]),
        powersync.execute(SelectPictures, [id]),
        powersync.execute(SelectReviews, [id]),
      ]);

      const newListing = listingResult.rows?._array[0] || null;
      const newImages = imagesResult.rows?._array || [];
      const newReviews = reviewsResult.rows?._array || [];

      const distance = (Number(dist_meters) / 1000).toFixed(1); // Convert to kilometers
      setListing({
        ...newListing,
        distance,
        lat: Number(lat),
        long: Number(long),
        images: newImages,
        reviews: newReviews,
      });
      console.log(listing);
    } catch (error) {
      console.error('Error fetching listing data:', error);
    }
  };

  const shareListing = async () => {
    try {
      await Share.share({
        message: '',
        // title: data?.name,
        // url: data?.listing_url,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const editListing = async () => {
    if (listing) {
      // const location = await Location.getCurrentPositionAsync({});
      // const todoId = uuid();
      // const point = `POINT(${location.coords.longitude}, ${location.coords.latitude})`;
      // const data = await db
      //   .insertInto(STORES_TABLE)
      //   .values({ id: todoId, name: '', description: '', location: point })
      //   .execute();
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerTransparent: true,

      // headerBackground: () => <Animated.View style={[headerAnimatedStyle, styles.header]} />,
      headerRight: () => (
        <View style={styles.bar}>
          {user && (
            <TouchableOpacity style={styles.roundButton} onPress={editListing}>
              <Ionicons name="create-outline" size={22} color="#000" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.roundButton} onPress={shareListing}>
            <Ionicons name="share-outline" size={22} color="#000" />
          </TouchableOpacity>
          {/*<TouchableOpacity style={styles.roundButton} onPress={saveListing}>*/}
          {/*  <Ionicons name="heart-outline" size={22} color="#000" />*/}
          {/*</TouchableOpacity>*/}
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity style={styles.roundButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, []);

  // const scrollOffset = useScrollViewOffset(scrollRef);
  // const imageAnimatedStyle = useAnimatedStyle(() => {
  //   return {
  //     transform: [
  //       {
  //         translateY: interpolate(
  //           scrollOffset.value,
  //           [-IMG_HEIGHT, 0, IMG_HEIGHT, IMG_HEIGHT],
  //           [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75]
  //         ),
  //       },
  //       {
  //         scale: interpolate(scrollOffset.value, [-IMG_HEIGHT, 0, IMG_HEIGHT], [2, 1, 1]),
  //       },
  //     ],
  //   };
  // });
  //
  // const headerAnimatedStyle = useAnimatedStyle(() => {
  //   return {
  //     opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT / 1.5], [0, 1]),
  //   };
  // }, []);

  const { width: screenWidth } = Dimensions.get('window');
  const baseOptions = {
    vertical: false,
    width: screenWidth,
    height: 300,
  };
  const carouselRef = useRef<ICarouselInstance>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const CarouselItem = React.memo(({ picture }: { picture: any }) => {
    const photoAttachment = toAttachmentRecord(picture);
    const uri = system.attachmentQueue?.getLocalUri(photoAttachment?.local_uri!);
    return (
      <View>
        <FastImage
          key={photoAttachment?.id}
          source={photoAttachment ? { uri, priority: FastImage.priority.normal } : defaultImage}
          style={styles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
      </View>
    );
  });
  return (
    <View style={styles.container}>
      <View>
        <View>
          {!listing ? (
            <Loader delay={200} amount={3} visible />
          ) : (
            <ScrollView style={styles.listingContainer}>
              <Carousel
                {...baseOptions}
                loop={false}
                ref={carouselRef}
                style={{
                  justifyContent: 'center',
                }}
                data={listing.images}
                pagingEnabled
                onSnapToItem={(index: number) => setSelectedIndex(index)}
                renderItem={({ item }) => <CarouselItem picture={item} />}
              />
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{listing.name}</Text>
                <Text style={styles.name}>{listing.description}</Text>
                <Text style={styles.name}>{listing.name}</Text>
                <Text style={styles.location}>
                  {listing.name} in {listing.name}
                </Text>
                <Text style={styles.description}>{listing.description}</Text>
                <View style={styles.divider} />
              </View>
              <View style={styles.reviewContainer}>
                <RatingSummary reviews={listing.reviews} />
                <View style={styles.divider} />
                {user ? (
                  <View>
                    <Text>Rate and review</Text>
                    <Avatar profile="A" />
                    <RatingScreen setRating={setRating} rating={rating} />
                  </View>
                ) : (
                  <View>
                    <Text>Sign in to rate and review</Text>
                  </View>
                )}
                <View style={styles.divider} />
                <ReviewsScreen reviews={listing.reviews} images={listing.images} />
              </View>
            </ScrollView>
          )}
        </View>

        {/*<Animated.View style={defaultStyles.footer} entering={SlideInDown.delay(200)} />*/}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  listingContainer: {
    // backgroundColor: 'red',
    // flex: 1,
  },
  image: {
    height: IMG_HEIGHT,
    width,
  },
  infoContainer: {
    padding: 24,
  },
  reviewContainer: {
    padding: 24,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'mon-sb',
  },
  location: {
    fontSize: 18,
    marginTop: 10,
    fontFamily: 'mon-sb',
  },
  rooms: {
    fontSize: 16,
    color: Colors.grey,
    marginVertical: 4,
    fontFamily: 'mon',
  },
  ratings: {
    fontSize: 16,
    fontFamily: 'mon-sb',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.grey,
    marginVertical: 16,
  },
  host: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: Colors.grey,
  },
  hostView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'red',
  },
  footerText: {
    height: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerPrice: {
    fontSize: 18,
    fontFamily: 'mon-sb',
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    color: Colors.primary,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  header: {
    backgroundColor: '#fff',
    height: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.grey,
  },
  description: {
    fontSize: 16,
    marginTop: 10,
    fontFamily: 'mon',
  },
});

export default DetailsPage;
