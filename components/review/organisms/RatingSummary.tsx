import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Rating } from 'react-native-elements';

import Colors from '~/constants/Colors';

const RatingSummary = ({ reviews }) => {
  const totalReviews = reviews.length;
  let averageRating = 0;
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, { rating }) => sum + rating, 0);
    averageRating = Number((totalRating / reviews.length).toFixed(1));
  }
  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews.forEach(({ rating }) => {
    ratingDistribution[rating - 1]++;
  });

  const ratingPercentages = ratingDistribution.map((count) => (count / totalReviews) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Review Summary</Text>
      <View style={styles.row}>
        <View style={styles.leftContainer}>
          <Text style={styles.averageRatingText}>{averageRating}</Text>
          <Rating imageSize={20} readonly startingValue={averageRating} />
          <Text style={styles.totalReviewsText}>({totalReviews})</Text>
        </View>
        <View style={styles.chartContainer}>
          {ratingPercentages.map((percentage, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  leftContainer: {
    marginRight: 20,
    alignItems: 'center',
  },
  averageRatingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  totalReviewsText: {
    fontSize: 16,
    color: '#666',
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    flex: 1,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
});

export default RatingSummary;
