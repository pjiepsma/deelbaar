import { StyleSheet, Animated, View, Dimensions } from "react-native";
import React from "react";
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";

const { width } = Dimensions.get("screen");

const Pagination = ({ data, scrollX }) => {
  return (
    <View style={styles.container}>
      {data.map((item, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];
        console.log(inputRange);
        const dotWidth = interpolate(
          scrollX.value,
          inputRange,
          [12, 30, 12],
          "clamp",
        );

        const backgroundColor = interpolateColor(scrollX.value, inputRange, [
          "#ccc",
          "#000",
          "#ccc",
        ]);

        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, backgroundColor }]}
          />
        );
      })}
    </View>
  );
};

export default Pagination;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 35,
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 3,
    backgroundColor: "#ccc",
  },
  dotActive: {
    backgroundColor: "#000",
  },
});
