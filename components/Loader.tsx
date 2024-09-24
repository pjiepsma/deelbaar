import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import Colors from '~/constants/Colors';

export default function Loader({ delay, amount }: { delay: number; amount: number }) {
  // Create a shared value for opacity
  const opacity = useSharedValue(0);

  // Animated style for the loader's opacity
  const animatedLoaderStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    // Start the fade-in effect
    opacity.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), // Fade in
      withDelay(500, withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })) // Fade out
    );
  }, []);

  return (
    <Animated.View style={[styles.loaderContainer, animatedLoaderStyle]}>
      <View style={styles.container}>
        {[...Array(amount)].map((_, i) => (
          <Dot delay={delay} index={i} amount={amount} key={i} />
        ))}
      </View>
    </Animated.View>
  );
}

function Dot({ delay, index, amount }: { delay: number; index: number; amount: number }) {
  const offset = useSharedValue<number>(0.75);
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: offset.value }],
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
          })
        ),
        -1
      )
    );
  }, []);

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
