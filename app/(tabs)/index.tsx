import { StyleSheet, View } from "react-native";
import React, { useMemo, useState } from "react";
import { Stack } from "expo-router";
import ExploreHeader from "@/components/ExploreHeader";
import Listings from "@/components/Listings";
import listingsData from "@/assets/data/airbnb-listings.json";
import listingsDataGeo from "@/assets/data/airbnb-listings.geo.json";
import miniBiebDataGeo from "@/assets/data/minibieb-listings.geo.json";
import waterDataGeo from "@/assets/data/water-listings.geo.json";

import { StatusBar } from "expo-status-bar";
import ListingsMap from "@/components/ListingsMap";
import ExploreCarousel from "@/components/ExploreCarousel";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ListingsBottomSheet from "@/components/ListingsBottomSheet";

const Page = () => {
  const items = useMemo(() => listingsData as any, []);
  const [category, setCategory] = useState("Books");

  const onDataChanged = (category: string) => {
    setCategory(category);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          header: () => <ExploreCarousel onCategoryChanged={onDataChanged} />,
        }}
      />
      {/*<Listings listings={items} category={category} />*/}
      <ListingsMap listings={miniBiebDataGeo} category={category} />
      <ListingsBottomSheet listings={items} category={category} />
    </View>
  );
};
export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
