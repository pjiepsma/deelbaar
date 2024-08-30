import {
  FlatList,
  StyleSheet,
  View,
  Text,
  Button,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useUserContext } from "@/app/auth/auth";
import { useGetUserById, useGetUsers } from "@/lib/query/user";
import Colors from "@/constants/Colors";
import { Link, Stack } from "expo-router";
import { defaultStyles } from "@/constants/Styles";
import Loader from "@/components/general/loader";
import Explore from "@/components/Explore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ListingItem } from "@/components/listing/ListingItem";
import ActionRow from "@/components/ActionRow";
import { useSharedValue } from "react-native-reanimated";
import Dropdown from "@/components/deprecated/Dropdown";
import { OptionItem } from "@/constants/Types";
import { useGetRecentPosts } from "@/lib/query/posts";

const DATA: OptionItem[] = [
  {
    value: "Books",
    icon: "library-outline",
  },
  {
    value: "Water",
    icon: "water-outline",
  },
];

const Page = () => {
  const { user } = useUserContext();
  const {
    data: creator,
    isLoading,
    isError: isErrorCreators,
  } = useGetUserById(user.id); // Fetch farovites of User instead of whole user. Filter data by category and use
  const listRef = useRef<FlatList>(null);
  const [category, setCategory] = useState<OptionItem>(DATA[0]);
  const [list, setList] = useState<any | null>(null);

  useEffect(() => {
    // filter creator.favorite by category
    const filtered = creator?.favorite
      .filter((item: any) => item.listing.category === category.value)
      .map((item: any) => item.listing);
    setList(filtered);
    console.log("Category", category);
    console.log("list", creator?.favorite);
    console.log("filtered", filtered);
  }, [category, creator]);

  return (
    <View style={defaultStyles.container}>
      <Stack.Screen
        options={{
          header: () => <SafeAreaView style={styles.safeArea}></SafeAreaView>,
        }}
      />
      {isLoading || !creator ? (
        <Loader delay={200} amount={3} />
      ) : (
        <View style={styles.box}>
          <Dropdown label="Select Item" data={DATA} onSelect={setCategory} />
          {list && (
            <FlatList renderItem={ListingItem} data={list} ref={listRef} />
          )}
        </View>
      )}
    </View>
  );
};
export default Page;

const styles = StyleSheet.create({
  box: {
    left: 10,
  },
  contentContainer: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "#fff",
    paddingTop: 10,
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
