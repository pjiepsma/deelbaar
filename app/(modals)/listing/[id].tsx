import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dimensions, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  interpolate,
  SlideInDown,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import Loader from '~/components/Loader';
import RatingScreen from '~/components/review/RatingScreen';
import ReviewsScreen from '~/components/review/ReviewScreen';
import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { system, useSystem } from '~/lib/powersync/PowerSync';
import { SelectListing, SelectPictures } from '~/lib/powersync/Queries';
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

  const { connector, powersync } = useSystem();
  const defaultImage = require('~/assets/images/default-placeholder.png');
  const navigation = useNavigation();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingRecord>(); // change type
  const [isLoading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  useEffect(() => {
    if (id) {
      const distance = (Number(dist_meters) / 1000).toFixed(1);
      // TODO fetch additional details
      getListing(id);
    }
  }, [id]);

  const getListing = async (id: string): Promise<void> => {
    const result = await powersync.execute(SelectListing, [id]);
    const images = await powersync.execute(SelectPictures, [id]);
    if (result.rows) {
      setListing(result.rows._array[0]);
      console.log(result.rows._array);
    }
    if (images.rows) {
      setImages(images.rows._array);
      console.log(images.rows._array);
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

      headerBackground: () => <Animated.View style={[headerAnimatedStyle, styles.header]} />,
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

  const scrollOffset = useScrollViewOffset(scrollRef);
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-IMG_HEIGHT, 0, IMG_HEIGHT, IMG_HEIGHT],
            [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-IMG_HEIGHT, 0, IMG_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT / 1.5], [0, 1]),
    };
  }, []);

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
        <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
          {isLoading || !listing ? (
            <Loader delay={200} amount={3} visible />
          ) : (
            <View style={styles.listingContainer}>
              <Carousel
                {...baseOptions}
                loop={false}
                ref={carouselRef}
                style={{
                  justifyContent: 'center',
                }}
                data={images}
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
                <Text style={styles.rooms}>{listing.name} bathrooms</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Ionicons name="star" size={16} />
                  {/*<Text style={styles.ratings}>*/}
                  {/*  {listing.review_scores_rating / 20} · {listing.number_of_reviews} reviews*/}
                  {/*</Text>*/}
                </View>
                <View style={styles.divider} />
                <View style={styles.hostView}>
                  <View>
                    {/*<Text style={{ fontWeight: '500', fontSize: 16 }}>*/}
                    {/*  Hosted by {listing.host_name}*/}
                    {/*</Text>*/}
                    {/*<Text style={{ fontWeight: '500', fontSize: 16 }}>*/}
                    {/*  Hosted by {data.creator.name}*/}
                    {/*</Text>*/}
                    {/*<Text>Host since {data.host_since}</Text>*/}
                  </View>
                </View>
                <View style={styles.divider} />
                <Text style={styles.description}>{listing.description}</Text>
              </View>
            </View>
          )}
        </Animated.ScrollView>

        <Animated.View style={defaultStyles.footer} entering={SlideInDown.delay(200)}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            {/*<RatingSummary />*/}

            {/* Star rating input (rate and review) */}
            <RatingScreen />

            {/* Review list with sorting */}
            <ReviewsScreen />
            <TouchableOpacity style={styles.footerText}>
              {/*<Text style={styles.footerPrice}>€{listing.price}</Text>*/}
              <Text>night</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[defaultStyles.btn, { paddingRight: 20, paddingLeft: 20 }]}>
              <Text style={defaultStyles.btnText}>Reserve</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
