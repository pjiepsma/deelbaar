import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';

import Colors from '~/constants/Colors';

interface AnimatedSplashProps {
  onFinish: () => void;
  onReady: boolean;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish, onReady }) => {
  const rotation = useSharedValue(0); // Controls rotation
  const opacity = useSharedValue(1); // Controls fade-out
  const splash = require('../assets/splash-logo.png');

  useEffect(() => {
    // Step 1: Charge up to the left, then spin right with fade out
    rotation.value = withSequence(
      withTiming(-25, { duration: 800, easing: Easing.ease }), // Rotate left (charging)
      withTiming(3600, { duration: 8000, easing: Easing.ease }) // Spin right
    );
  }, []);

  useEffect(() => {
    if (onReady) {
      opacity.value = withDelay(
        1600,
        withTiming(0, { duration: 800, easing: Easing.ease }, () => {
          runOnJS(onFinish)(); // Signal to hide the splash screen after animation
        })
      );
    }
  }, [onReady]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image source={splash} style={styles.logo} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light,
  },
  logoContainer: {
    width: 150,
    height: 150,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default AnimatedSplash;
