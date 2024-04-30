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
        withDelay(
          delay * amount * 0.75,
          withSequence(
            withTiming(2, {
              duration: delay,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, {
              duration: delay,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
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
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: "red",
  },
  box: {
    height: 10,
    width: 10,
    backgroundColor: "#b58df1",
    borderRadius: 60,
  },
});
