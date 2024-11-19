import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';

import Colors from '~/constants/Colors';

const MAX_STARS = 5;
const STAR_SIZE = 36;

interface StarstarsProps {
  rating: number;
  setRating: (rating: number) => void;
}

const Starstars: React.FC<StarstarsProps> = ({ rating, setRating }) => {
  const [stars, setStars] = useState(0);
  const panX = useSharedValue(0);

  const starWidth = STAR_SIZE * MAX_STARS;

  const handleNavigate = () => {
    setRating(stars);
  };

  useEffect(() => {
    if (rating !== stars) {
      setStars(rating);
      panX.value = withSpring((rating / MAX_STARS) * starWidth);
    }
  }, [rating]);

  // Function to handle clicks on stars
  const handleStarPress = (index: number) => {
    const newRating = index + 1;
    if (newRating === rating) {
      setRating(rating - 1); // Deselect the current star
      panX.value = withSpring((rating - 1) * (starWidth / MAX_STARS));
    } else {
      setRating(newRating);
      panX.value = withSpring(newRating * (starWidth / MAX_STARS));
    }
  };

  // Gesture handler for swiping
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const x = Math.max(0, Math.min(event.translationX, starWidth)); // Constrain swipe to star area
      const newstars = Math.ceil((x / starWidth) * MAX_STARS);
      runOnJS(setStars)(newstars); // Update stars in JS
      panX.value = x; // Update pan position
    })
    .onEnd(() => {
      panX.value = withSpring(stars * (starWidth / MAX_STARS)); // Snap to the nearest star on release

      // Navigate after swipe ends
      runOnJS(handleNavigate)(); // Call navigation after swipe ends
    });

  const derivedPanX = useDerivedValue(() => panX.value);

  // Animated style for the highlight area
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: derivedPanX.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* GestureDetector for swipe gestures */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.starsWrapper}>
          {/* Highlight bar behind the stars */}
          <Animated.View style={[styles.highlight, animatedStyle]} />
          {/* Render Stars */}
          {[...Array(MAX_STARS)].map((_, index) => (
            <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
              <FontAwesome
                name={index < stars ? 'star' : 'star-o'}
                size={STAR_SIZE}
                color={index < stars ? 'gold' : Colors.border}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  starsWrapper: {
    flexDirection: 'row',
    position: 'relative',
    width: STAR_SIZE * MAX_STARS,
    height: STAR_SIZE,
  },
  star: {
    marginHorizontal: 5,
    zIndex: 1, // Ensure stars are above the highlight
  },
  highlight: {
    position: 'absolute',
    height: STAR_SIZE,
    backgroundColor: 'transparent',
    zIndex: 0, // Highlight behind the stars
  },
  starsText: {
    marginTop: 20,
    fontSize: 18,
  },
});

export default Starstars;
