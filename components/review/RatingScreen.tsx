import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import StarRating from 'react-native-star-rating-widget';

const RatingScreen = () => {
  const [rating, setRating] = useState(0);
  return <StarRating rating={rating} onChange={setRating} />;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  ratingText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default RatingScreen;
