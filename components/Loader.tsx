import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import Colors from '~/constants/Colors';

export default function Loader({
  delay,
  amount,
  visible,
}: {
  delay: number;
  amount: number;
  visible: boolean;
}) {
  const opacity = useSharedValue(0);

  // Animated style for the loader's opacity
  const animatedLoaderStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(
        0,
        withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) })
      );
    } else {
      opacity.value = withDelay(
        250,
        withTiming(0, { duration: 250, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.loaderContainer, animatedLoaderStyle]}>
      <View style={styles.container}>
        {[...Array(amount)].map((_, i) => (
          <Dot delay={delay} index={i} amount={amount} visible={visible} key={i} />
        ))}
      </View>
    </Animated.View>
  );
}

function Dot({
  delay,
  index,
  amount,
  visible,
}: {
  delay: number;
  index: number;
  amount: number;
  visible: boolean;
}) {
  const offset = useSharedValue<number>(0.75);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: offset.value }],
    };
  });

  useEffect(() => {
    if (visible) {
      // Start animation when visible is true
      offset.value = withDelay(
        delay * index,
        withRepeat(
          withSequence(
            withTiming(1.5, {
              duration: delay,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, {
              duration: delay,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, {
              duration: delay * amount * 0.5,
            })
          ),
          -1,
          false
        )
      );
    } else {
      // Reset and cancel animation when visible is false
      cancelAnimation(offset);
      offset.value = 0.75; // Reset to initial scale
    }
  }, [visible, delay, index, amount]);

  return <Animated.View style={[styles.box, animatedStyles]} />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  box: {
    height: 10,
    width: 10,
    backgroundColor: Colors.primary,
    borderRadius: 60,
  },
});
