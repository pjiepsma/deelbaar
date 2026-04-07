import { FontAwesome } from '@expo/vector-icons';
import { XStack, YStack, Text } from 'tamagui';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';

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
    <YStack>
      {/* GestureDetector for swipe gestures */}
      <GestureDetector gesture={panGesture}>
        <YStack position="relative" width={STAR_SIZE * MAX_STARS} height={STAR_SIZE}>
          {/* Highlight bar behind the stars */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                height: STAR_SIZE,
                backgroundColor: 'transparent',
                zIndex: 0,
              },
              animatedStyle,
            ]}
          />

          {/* Render Stars */}
          <XStack gap={8}>
            {[...Array(MAX_STARS)].map((_, index) => (
              <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
                <FontAwesome
                  name={index < stars ? 'star' : 'star-o'}
                  size={STAR_SIZE}
                  color={index < stars ? '#6B8E23' : '#D1D5DB'}
                  style={{ zIndex: 1 }}
                />
              </TouchableOpacity>
            ))}
          </XStack>
        </YStack>
      </GestureDetector>

      {stars > 0 && (
        <Text fontSize={14} color="#6B8E23" marginTop={8} fontWeight="600">
          {stars} star{stars !== 1 ? 's' : ''}
        </Text>
      )}
    </YStack>
  );
};

export default Starstars;
