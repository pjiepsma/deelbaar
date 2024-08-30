import {
  Dimensions,
  Image,
  ImageURISource,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useState } from "react";
import Colors from "@/constants/Colors";
import { SharedValue, useAnimatedRef } from "react-native-reanimated";
import CarouselItem from "./Item";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  images: any[];
  deleteImage: (index: number) => void;
  mode: "show" | "edit";
}

const Slider = ({ images, deleteImage, mode }: Props) => {
  const animatedRef = useAnimatedRef<Animated.FlatList<Image>>();
  const [index, setIndex] = useState(0);

  const onNavigatorPress = (i: number) => {
    if (i === index) {
      deleteImage(i);
      if (i !== 0) {
        scrollToIndex(i - 1);
      }
    } else {
      scrollToIndex(i);
      setIndex(i);
    }
  };

  const scrollToIndex = (i: number) => {
    animatedRef.current?.scrollToIndex({
      animated: true,
      index: i,
    });
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={animatedRef}
        horizontal
        onViewableItemsChanged={({ viewableItems, changed }) => {
          setIndex(viewableItems[0].index || 0);
        }}
        data={images}
        snapToAlignment="center"
        decelerationRate={"normal"}
        snapToInterval={Dimensions.get("window").width}
        keyExtractor={(item) => item.uri}
        renderItem={({ item, index }) => {
          return <CarouselItem item={item} index={index} />;
        }}
      />
      {mode === "edit" && (
        <View style={styles.row}>
          {images.map((item: any, i: number) => (
            <View key={i} style={styles.image}>
              <TouchableOpacity key={i} onPress={() => onNavigatorPress(i)}>
                {i === index && (
                  <Ionicons
                    style={styles.trash}
                    name="trash-outline"
                    size={24}
                  />
                )}
                <Image
                  source={item}
                  style={{
                    width: 50,
                    height: 50,
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default Slider;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    alignItems: "center",
  },
  image: {},
  row: {
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "red",
  },
  trash: {
    position: "absolute",
    alignSelf: "center",
    bottom: "30%",
    color: "white",
    zIndex: 2,
  },
});
