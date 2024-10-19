import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Rating } from 'react-native-elements';

// Mock data
const totalReviews = 32;
const averageRating = 4.7;
const ratingDistribution = [25, 4, 2, 0, 1]; // Number of reviews for 5, 4, 3, 2, 1 stars

// Calculate percentage for each star rating
const ratingPercentages = ratingDistribution.map((count) => (count / totalReviews) * 100);

const RatingSummary = () => {
  return (
    <View style={styles.container}>
      {/* Average rating and total reviews */}
      <View style={styles.averageRatingContainer}>
        <Text style={styles.averageRatingText}>{averageRating}</Text>
        <Rating imageSize={20} readonly startingValue={averageRating} style={styles.rating} />
        <Text style={styles.totalReviewsText}>({totalReviews} reviews)</Text>
      </View>

      {/* Custom Bar Chart */}
      <View style={styles.chartContainer}>
        {ratingPercentages.map((percentage, index) => (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.starText}>{5 - index} ★</Text>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRatingText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFB300', // Yellow color for average rating number
  },
  rating: {
    marginHorizontal: 10,
  },
  totalReviewsText: {
    fontSize: 16,
    color: '#666',
  },
  chartContainer: {
    marginTop: 20,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starText: {
    width: 30,
    fontSize: 16,
    color: '#333',
  },
  barBackground: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFA500', // Orange color for the filled bar
    borderRadius: 10,
  },
  percentageText: {
    width: 40,
    fontSize: 14,
    color: '#333',
  },
});

export default RatingSummary;
