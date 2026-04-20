import React from 'react';
import { Text, View } from 'react-native';

import Colors from '~/constants/Colors';

function DistributionBar({
  percentage,
}: {
  percentage: number;
}) {
  const p = Math.min(100, Math.max(0, percentage));
  const rest = 100 - p;
  return (
    <View style={{ flex: 1, height: 8, flexDirection: 'row', borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ flex: Math.max(p, 0.001), backgroundColor: Colors.primary }} />
      <View style={{ flex: Math.max(rest, 0.001), backgroundColor: Colors.border.light }} />
    </View>
  );
}

const RatingSummary = ({ reviews }: { reviews: Array<{ rating: number }> }) => {
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

  const ratingPercentages = ratingDistribution.map((count) =>
    totalReviews > 0 ? (count / totalReviews) * 100 : 0
  );

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Text
        key={i}
        style={{
          fontSize: 14,
          color: i < Math.floor(rating) ? Colors.primary : Colors.border.light,
        }}>
        {i < Math.floor(rating) ? '★' : '☆'}
      </Text>
    ));
  };

  return (
    <View style={{ gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.text.primary }}>Reviews</Text>

      {totalReviews > 0 ? (
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
          <View style={{ gap: 8, alignItems: 'center', minWidth: 100 }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.primary }}>{averageRating}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>{renderStars(averageRating)}</View>
            <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={{ gap: 8, flex: 1 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = ratingPercentages[star - 1];
              const count = ratingDistribution[star - 1];

              return (
                <View key={star} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: Colors.text.secondary, minWidth: 30 }}>
                    {star} ⭐
                  </Text>
                  <DistributionBar percentage={percentage} />
                  <Text style={{ fontSize: 12, color: Colors.text.secondary, minWidth: 24 }}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: Colors.background.secondary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border.light,
            padding: 24,
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text.secondary, marginBottom: 4 }}>
            No reviews yet
          </Text>
          <Text style={{ fontSize: 14, color: Colors.text.secondary, textAlign: 'center' }}>
            Be the first to review this Minibieb!
          </Text>
        </View>
      )}
    </View>
  );
};

export default RatingSummary;
