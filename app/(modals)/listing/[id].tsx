import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import Animated, {
  SlideInDown,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { defaultStyles } from "@/constants/Styles";
import {
  useGetPostById,
  useGetRecentPosts,
  useSavePost,
} from "@/lib/query/posts";
import Loader from "@/components/general/loader";
import { useUserContext } from "@/app/auth/auth";
import Slider from "@/components/carousel/Slider";

const { width } = Dimensions.get("window");
const IMG_HEIGHT = 300;

const DetailsPage = () => {
  // details page should differentiate between type of listing
  const { user, isAdmin } = useUserContext();

  const { id } = useLocalSearchParams<{ id: string }>();
  let { data, isLoading } = useGetPostById(id);
  const defaultImage = require("@/assets/images/default-placeholder.png");
  const navigation = useNavigation();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const { mutate: savePost, isError: isErrorSave } = useSavePost();

  const shareListing = async () => {
    try {
      await Share.share({
        title: data?.name,
        url: data?.listing_url,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const saveListing = async () => {
    try {
      savePost({ userId: user.id, postId: id });
    } catch (err) {
      console.log(err);
    }
  };

  const editListing = async () => {
    try {
      savePost({ userId: user.id, postId: id });
    } catch (err) {
      console.log(err);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerTransparent: true,

      headerBackground: () => (
        <Animated.View
          style={[headerAnimatedStyle, styles.header]}
        ></Animated.View>
      ),
      headerRight: () => (
        <View style={styles.bar}>
          {isAdmin && (
            <TouchableOpacity style={styles.roundButton} onPress={editListing}>
              <Ionicons name="create-outline" size={22} color={"#000"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.roundButton} onPress={shareListing}>
            <Ionicons name="share-outline" size={22} color={"#000"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundButton} onPress={saveListing}>
            <Ionicons name="heart-outline" size={22} color={"#000"} />
          </TouchableOpacity>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={"#000"} />
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
            [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-IMG_HEIGHT, 0, IMG_HEIGHT],
            [2, 1, 1],
          ),
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
          scrollEventThrottle={16}
        >
          {isLoading || !data ? (
            <Loader delay={200} amount={3} />
          ) : (
            <View>
              <Slider
                images={data.images.lenght ? data.images : [defaultImage]}
                deleteImage={() => {}}
                mode="show"
              />
              <View style={styles.infoContainer}>
                {/*<Text style={styles.name}>{listing.name}</Text>*/}
                <Text style={styles.name}>{data.caption}</Text>
                <Text style={styles.name}>{data.coordinates}</Text>
                {/* Show map based on coordinates */}
                <Text style={styles.location}>
                  {data.room_type} in {data.smart_location}
                </Text>
                <Text style={styles.rooms}>
                  {data.guests_included} guests · {data.bedrooms} bedrooms ·{" "}
                  {data.beds} bed · {data.bathrooms} bathrooms
                </Text>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Ionicons name="star" size={16} />
                  {/*<Text style={styles.ratings}>*/}
                  {/*  {listing.review_scores_rating / 20} ·{" "}*/}
                  {/*  {listing.number_of_reviews} reviews*/}
                  {/*</Text>*/}
                </View>
                <View style={styles.divider} />

                <View style={styles.hostView}>
                  <Image
                    source={{ uri: data.host_picture_url }}
                    style={styles.host}
                  />

                  <View>
                    {/*<Text style={{ fontWeight: "500", fontSize: 16 }}>*/}
                    {/*  Hosted by {listing.host_name}*/}
                    {/*</Text>*/}
                    <Text style={{ fontWeight: "500", fontSize: 16 }}>
                      Hosted by {data.creator.name}
                    </Text>
                    <Text>Host since {data.host_since}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/*<Text style={styles.description}>{listing.description}</Text>*/}
              </View>
            </View>
          )}
        </Animated.ScrollView>
        {/*
         <Animated.View
          style={defaultStyles.footer}
          entering={SlideInDown.delay(200)}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity style={styles.footerText}>
              <Text style={styles.footerPrice}>€{listing.price}</Text>
              <Text>night</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[defaultStyles.btn, { paddingRight: 20, paddingLeft: 20 }]}
            >
              <Text style={defaultStyles.btnText}>Reserve</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  image: {
    height: IMG_HEIGHT,
    width: width,
  },
  infoContainer: {
    padding: 24,
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "mon-sb",
  },
  location: {
    fontSize: 18,
    marginTop: 10,
    fontFamily: "mon-sb",
  },
  rooms: {
    fontSize: 16,
    color: Colors.grey,
    marginVertical: 4,
    fontFamily: "mon",
  },
  ratings: {
    fontSize: 16,
    fontFamily: "mon-sb",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    height: "100%",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerPrice: {
    fontSize: 18,
    fontFamily: "mon-sb",
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    color: Colors.primary,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  header: {
    backgroundColor: "#fff",
    height: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.grey,
  },

  description: {
    fontSize: 16,
    marginTop: 10,
    fontFamily: "mon",
  },
});

export default DetailsPage;
