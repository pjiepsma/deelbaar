import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolation,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/Colors";

export default function Loader({
  delay,
  amount,
}: {
  delay: number;
  amount: number;
}) {
  return (
    <View style={styles.container}>
      {[...Array(amount)].map((e, i) => (
        <Dot delay={delay} index={i} amount={amount} key={i} />
      ))}
    </View>
  );
}

function Dot({
  delay,
  index,
  amount,
}: {
  delay: number;
  index: number;
  amount: number;
}) {
  const offset = useSharedValue<number>(1);
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: offset.value }, { translateY: -offset.value * 5 }],
    };
  });

  useEffect(() => {
    offset.value = withDelay(
      delay * index,
      withRepeat(
        withSequence(
          withTiming(2, {
            duration: delay,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: delay,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: delay * amount * 0.75,
          }),
        ),
        -1,
      ),
    );
  }, []);

  return <Animated.View key={index} style={[styles.box, animatedStyles]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    gap: 10,
  },
  box: {
    height: 10,
    width: 10,
    backgroundColor: Colors.primary,
    borderRadius: 60,
  },
});
