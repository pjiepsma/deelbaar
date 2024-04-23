import { StyleSheet, View } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Stack } from "expo-router";
import listingsData from "@/assets/data/airbnb-listings.json";
import miniBiebDataGeo from "@/assets/data/minibieb-listings.geo.json";

import { StatusBar } from "expo-status-bar";
import ListingsMap from "@/components/ListingsMap";
import ExploreCarousel from "@/components/ExploreCarousel";
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
