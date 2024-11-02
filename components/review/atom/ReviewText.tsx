import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface ReviewTextProps {
  description: string;
}

const ReviewText: React.FC<ReviewTextProps> = ({ description }) => {
  return (
    <Text numberOfLines={3} style={styles.reviewText}>
      {description}
    </Text>
  );
};

const styles = StyleSheet.create({
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ReviewText;
