import {
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stack } from "expo-router";
import listingsData from "@/assets/data/airbnb-listings.json";
import miniBiebDataGeo from "@/assets/data/minibieb-listings.geo.json";
import { StatusBar } from "expo-status-bar";
import Header from "@/components/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetRecentPosts } from "@/lib/query/posts";
import FilterModal from "@/app/(modals)/explore/filter";

import Explore from "@/components/Explore";
import { defaultStyles } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Dropdown from "@/components/deprecated/Dropdown";
import ActionRow from "@/components/ActionRow";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { ImageAssets } from "@/assets/images/ImageAssets";
import ListingsMap from "@/components/listing/ListingsMap";
import ListingsBottomSheet from "@/components/listing/ListingsBottomSheet";

const Index = () => {
  const [category, setCategory] = useState("Books");
  const [modalState, setModalState] = useState(false);
  const animatedPosition = useSharedValue(0);

  const {
    data: posts,
    isLoading: isPostLoading,
    isError: isErrorPosts,
  } = useGetRecentPosts();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeAreaView style={styles.safeArea}>
              <Header
                onNotificationsPress={() => {}}
                onProfilePress={() => {}}
              />
            </SafeAreaView>
          ),
        }}
      />
      <ActionRow
        onCategoryChanged={setCategory}
        setModalState={setModalState}
        animatedPosition={animatedPosition}
      />

      <ListingsMap listings={posts} category={category} />

      <ListingsBottomSheet
        listings={posts}
        category={category}
        animatedPosition={animatedPosition}
      />
      <FilterModal state={modalState} setState={setModalState} />
    </View>
  );
};
export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    backgroundColor: "#fff",
    // paddingTop: 10,
    // paddingBottom: 10,
  },
});
