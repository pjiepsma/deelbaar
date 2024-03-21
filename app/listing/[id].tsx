import { Text, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";

const Page = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  console.log(id);
  return (
    <View>
      <Text> {id} </Text>
    </View>
  );
};

export default Page;
