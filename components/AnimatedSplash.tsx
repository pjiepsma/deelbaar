import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  withDelay,
  useDerivedValue,
} from 'react-native-reanimated';

import Colors from '~/constants/Colors';

interface AnimatedSplashProps {
  onFinish: () => void;
  onReady: boolean;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish, onReady }) => {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const splash = require('../assets/splash-logo.png');

  useEffect(() => {
    rotation.value = withSequence(
      withTiming(-10, { duration: 600, easing: Easing.ease }),
      withTiming(3600, { duration: 8000, easing: Easing.ease })
    );
  }, []);

  useEffect(() => {
    if (onReady) {
      opacity.value = withDelay(
        3000,
        withTiming(0, { duration: 100, easing: Easing.ease }, () => {
          runOnJS(onFinish)();
        })
      );
    }
  }, [onReady]);

  const derivedRotation = useDerivedValue(() => rotation.value);
  const derivedOpacity = useDerivedValue(() => opacity.value);

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${derivedRotation.value}deg` }],
  }));

  const animatedOpacityStyle = useAnimatedStyle(() => ({
    opacity: derivedOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedOpacityStyle]}>
      <Animated.View style={[styles.logoContainer, animatedRotateStyle]}>
        <Image source={splash} style={styles.logo} />
      </Animated.View>
    </Animated.View>
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
    width: 100,
    height: 100,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default AnimatedSplash;
