import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useRef } from "react";
import { useDeletePost, useGetUserPosts } from "@/lib/query/posts";
import { useUserContext } from "@/app/auth/auth";
import { useGetUserById, useGetUsers } from "@/lib/query/user";
import Listings from "@/components/Listings";
import Colors from "@/constants/Colors";
import { Listing } from "@/interfaces/listing";
import { Link } from "expo-router";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { defaultStyles } from "@/constants/Styles";
import {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
} from "@gorhom/bottom-sheet";
import { IUser } from "@/types";
import Loader from "@/components/loader";
import Dot from "@/components/loader";

const Page = () => {
  const dots = [1, 2, 3];

  const { user } = useUserContext();
  const isLoading = true;
  const {
    data: creator,
    // isLoading
    isError: isErrorCreators,
  } = useGetUserById(user.id); // Fetch farovites of User instead of whole user
  const listRef = useRef<FlatList>(null);

  const renderRow: ListRenderItem<any> = ({ item }) => (
    <Link href={`/listing/${item.id}`} asChild>
      <TouchableOpacity>
        <Animated.View
          style={styles.listing}
          entering={FadeInRight}
          exiting={FadeOutLeft}
        >
          <Text>{JSON.stringify(item.listing.caption)}</Text>
          <Animated.Image
            source={{ uri: item.listing.imageUrl }}
            style={styles.image}
          />
          <TouchableOpacity
            style={{ position: "absolute", right: 30, top: 30 }}
          >
            <Ionicons name="heart-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontSize: 16, fontFamily: "mon-sb" }}>
              {item.name}
            </Text>
            {/*<View style={{ flexDirection: "row", gap: 4 }}>*/}
            {/*  <Ionicons name="star" size={16} />*/}
            {/*  <Text style={{ fontFamily: "mon-sb" }}>*/}
            {/*    {item.review_scores_rating / 20}*/}
            {/*  </Text>*/}
            {/*</View>*/}
          </View>
          <Text style={{ fontFamily: "mon" }}>{item.caption}</Text>
          {/*<View style={{ flexDirection: "row", gap: 4 }}>*/}
          {/*  <Text style={{ fontFamily: "mon-sb" }}>€ {item.price}</Text>*/}
          {/*  <Text style={{ fontFamily: "mon" }}>night</Text>*/}
          {/*</View>*/}
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={defaultStyles.container}>
      {isLoading || !creator ? (
        <Loader delay={250} amount={5} />
      ) : (
        <FlatList
          renderItem={renderRow}
          data={creator.favorite}
          ref={listRef}
        />
      )}
    </View>
  );
};
export default Page;

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  absoluteView: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
  },
  btn: {
    backgroundColor: Colors.dark,
    padding: 14,
    height: 50,
    borderRadius: 30,
    flexDirection: "row",
    marginHorizontal: "auto",
    alignItems: "center",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {
      width: 1,
      height: 1,
    },
  },
  listing: {
    padding: 16,
    gap: 10,
    marginVertical: 0,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  info: {
    textAlign: "center",
    fontFamily: "mon-sb",
    fontSize: 16,
    marginTop: 4,
    color: Colors.dark,
  },
});
