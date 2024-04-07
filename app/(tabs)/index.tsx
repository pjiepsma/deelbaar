import { StyleSheet, View } from "react-native";
import React, { useMemo, useState } from "react";
import { Stack } from "expo-router";
import ExploreHeader from "@/components/ExploreHeader";
import Listings from "@/components/Listings";
import listingsData from "@/assets/data/airbnb-listings.json";
import listingsDataGeo from "@/assets/data/airbnb-listings.geo.json";
import miniBiebDataGeo from "@/assets/data/minibieb-listings.geo.json";

import {StatusBar} from "expo-status-bar";
import ListingsMap from "@/components/ListingsMap";

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
          header: () => <ExploreHeader onCategoryChanged={onDataChanged} />,
        }}
      />
      {/*<Listings listings={items} category={category} />*/}
        <ListingsMap listings={miniBiebDataGeo} />
    </View>
  );
};
export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
