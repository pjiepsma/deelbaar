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
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  onFinish: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish }) => {
  const rotation = useSharedValue(0); // Controls rotation
  const opacity = useSharedValue(1); // Controls fade-out

  useEffect(() => {
    // Step 1: Charge up to the left, then spin right with fade out
    rotation.value = withSequence(
      withTiming(-20, { duration: 800, easing: Easing.ease }), // Rotate left (charging)
      withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }), // Spin right
        2, // Number of full spins
        false
      ),
      withTiming(720, { duration: 600, easing: Easing.ease }) // Final fast spin
    );

    opacity.value = withTiming(0, { duration: 600, easing: Easing.ease }, () => {
      runOnJS(onFinish)(); // Signal to hide the splash screen after animation
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image source={require('../assets/splash-logo.png')} style={styles.logo} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff', // Adjust based on app theme
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
