import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Dimensions, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  SlideInDown,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

import Loader from '~/components/Loader';
import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { SelectListing } from '~/lib/powersync/Queries';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

const DetailsPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { connector, powersync } = useSystem();
  const defaultImage = require('~/assets/images/default-placeholder.png');
  const navigation = useNavigation();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingRecord>(); // change type
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    getListing(id);
  }, [id]);

  const getListing = async (id: string): Promise<void> => {
    const result = await powersync.execute(SelectListing, [id]);
    const resultRecord = result.rows?.item(0);
    console.log(resultRecord);
    // setListing(resultRecord);
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

  // const saveListing = async () => {
  //   const location = await Location.getCurrentPositionAsync({});
  //   const todoId = uuid();
  //   const point = `POINT(${location.coords.longitude}, ${location.coords.latitude})`;
  //   const data = await db
  //     .insertInto(STORES_TABLE)
  //     .values({ id: todoId, name: '', description: '', location: point })
  //     .execute();
  // };
  //
  // const editListing = async () => {
  //   if (listing) {
  //     const location = await Location.getCurrentPositionAsync({});
  //     const todoId = uuid();
  //     const point = `POINT(${location.coords.longitude}, ${location.coords.latitude})`;
  //     const data = await db
  //       .insertInto(STORES_TABLE)
  //       .values({ id: todoId, name: '', description: '', location: point })
  //       .execute();
  //   }
  // };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerTransparent: true,

      headerBackground: () => <Animated.View style={[headerAnimatedStyle, styles.header]} />,
      headerRight: () => (
        <View style={styles.bar}>
          {/*{isAdmin && (
            <TouchableOpacity style={styles.roundButton} onPress={editListing}>
              <Ionicons name="create-outline" size={22} color={"#000"} />
            </TouchableOpacity>
          )}*/}
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

  return (
    <View style={styles.container}>
      <View>
        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          ref={scrollRef}
          scrollEventThrottle={16}>
          {isLoading || !listing ? (
            <Loader delay={200} amount={3} />
          ) : (
            <View>
              {/*<Slider*/}
              {/*  images={listing.images.lenght ? listing.images : [defaultImage]}*/}
              {/*  deleteImage={() => {}}*/}
              {/*  mode="show"*/}
              {/*/>*/}
              <View style={styles.infoContainer}>
                {/*<Text style={styles.name}>{listing.name}</Text>*/}
                {/*<Text style={styles.name}>{listing.caption}</Text>*/}
                {/*<Text style={styles.name}>{listing.coordinates}</Text>*/}
                {/*Show map based on coordinates*/}
                {/*<Text style={styles.location}>*/}
                {/*  {listing.room_type} in {listing.smart_location}*/}
                {/*</Text>*/}
                {/*<Text style={styles.rooms}>*/}
                {/*  {data.guests_included} guests · {data.bedrooms} bedrooms · {data.beds} bed ·{' '}*/}
                {/*  {data.bathrooms} bathrooms*/}
                {/*</Text>*/}
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Ionicons name="star" size={16} />
                  {/*<Text style={styles.ratings}>*/}
                  {/*  {listing.review_scores_rating / 20} · {listing.number_of_reviews} reviews*/}
                  {/*</Text>*/}
                </View>
                <View style={styles.divider} />
                <View style={styles.hostView}>
                  {/*<Image source={{ uri: data.host_picture_url }} style={styles.host} />*/}
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
  image: {
    height: IMG_HEIGHT,
    width,
  },
  infoContainer: {
    padding: 24,
    backgroundColor: '#fff',
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
