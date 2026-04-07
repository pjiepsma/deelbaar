import { YStack, XStack, Text, Progress } from 'tamagui';
import React from 'react';

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

  const ratingPercentages = ratingDistribution.map((count) =>
    totalReviews > 0 ? (count / totalReviews) * 100 : 0
  );

  // Simple flat stars - no gradients
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Text
        key={i}
        fontSize={14}
        color={i < Math.floor(rating) ? Colors.primary : Colors.border.light}>
        {i < Math.floor(rating) ? '★' : '☆'}
      </Text>
    ));
  };

  return (
    <YStack gap={16}>
      <Text fontSize={18} fontWeight="600" color={Colors.text.primary}>
        Reviews
      </Text>

      {totalReviews > 0 ? (
        <XStack gap={24} alignItems="flex-start">
          {/* Left: Average Rating */}
          <YStack gap={8} alignItems="center" minWidth={100}>
            <Text fontSize={32} fontWeight="700" color={Colors.primary}>
              {averageRating}
            </Text>
            <XStack gap={4}>{renderStars(averageRating)}</XStack>
            <Text fontSize={14} color={Colors.text.secondary}>
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </Text>
          </YStack>

          {/* Right: Rating Distribution */}
          <YStack gap={8} flex={1}>
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = ratingPercentages[star - 1];
              const count = ratingDistribution[star - 1];

              return (
                <XStack key={star} gap={8} alignItems="center">
                  <Text fontSize={12} color={Colors.text.secondary} minWidth={30}>
                    {star} ⭐
                  </Text>
                  <Progress value={percentage} flex={1} size="$2">
                    <Progress.Indicator backgroundColor={Colors.primary} animation="bouncy" />
                  </Progress>
                  <Text fontSize={12} color={Colors.text.secondary} minWidth={24}>
                    {count}
                  </Text>
                </XStack>
              );
            })}
          </YStack>
        </XStack>
      ) : (
        <YStack
          backgroundColor={Colors.background.secondary}
          borderRadius={12}
          borderWidth={1}
          borderColor={Colors.border.light}
          padding={24}
          alignItems="center">
          <Text fontSize={16} fontWeight="600" color={Colors.text.secondary} marginBottom={4}>
            No reviews yet
          </Text>
          <Text fontSize={14} color={Colors.text.secondary} textAlign="center">
            Be the first to review this Minibieb!
          </Text>
        </YStack>
      )}
    </YStack>
  );
};

export default RatingSummary;
