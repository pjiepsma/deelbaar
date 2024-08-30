import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

type Props = {
  // item: {
  //   id: string;
  //   title: string;
  //   img: any;
  // };
  index: number;
  scrollX: SharedValue<number>;
};
const { width } = Dimensions.get("window");

const CarouselItem = ({ item, index }: any) => {
  // const rnStyle = useAnimatedStyle(() => {
  //   return {
  //     //get the previous and next item on the view of the active item, only a little bit
  //     transform: [
  //       {
  //         translateX: interpolate(
  //           scrollX.value,
  //           [(index - 1) * width, index * width, (index + 1) * width],
  //           [-width * 0.15, 0, width * 0.15],
  //           "clamp",
  //         ),
  //       },
  //       {
  //         scale: interpolate(
  //           scrollX.value,
  //           [(index - 1) * width, index * width, (index + 1) * width],
  //           [0.9, 1, 0.9],
  //           "clamp",
  //         ),
  //       },
  //     ],
  //   };
  // });
  return (
    <Animated.View
      style={[
        { width, height: 250 }, //  rnStyle,
      ]}
      key={item.uri}
    >
      <Image
        source={item}
        style={{
          width: "100%",
          height: "100%",
        }}
        resizeMode="cover"
      />
      <Text>{item.title}</Text>
    </Animated.View>
  );
};

export default CarouselItem;

const styles = StyleSheet.create({});
