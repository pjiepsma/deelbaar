import {
  VStack,
  HStack,
  Text,
  Heading,
  Box,
  Progress,
  ProgressFilledTrack,
} from '@gluestack-ui/themed';
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
        size="sm"
        color={i < Math.floor(rating) ? Colors.primary : Colors.border.light}>
        {i < Math.floor(rating) ? '★' : '☆'}
      </Text>
    ));
  };

  return (
    <VStack space="md">
      <Heading size="lg" color={Colors.text.primary}>
        Reviews
      </Heading>

      {totalReviews > 0 ? (
        <HStack space="lg" alignItems="flex-start">
          {/* Left: Average Rating */}
          <VStack space="xs" alignItems="center" minWidth={100}>
            <Heading size="3xl" color={Colors.primary}>
              {averageRating}
            </Heading>
            <HStack space="2xs">{renderStars(averageRating)}</HStack>
            <Text size="sm" color={Colors.text.secondary}>
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </Text>
          </VStack>

          {/* Right: Rating Distribution */}
          <VStack space="xs" flex={1}>
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = ratingPercentages[star - 1];
              const count = ratingDistribution[star - 1];

              return (
                <HStack key={star} space="sm" alignItems="center">
                <Text size="xs" color={Colors.text.secondary} minWidth={30}>
                    {star} ⭐
                  </Text>
                  <Progress value={percentage} w="$full" size="sm">
                  <ProgressFilledTrack bg={Colors.primary} />
                  </Progress>
                  <Text size="xs" color={Colors.text.secondary} minWidth={24}>
                    {count}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </HStack>
      ) : (
        <Box
          bg={Colors.background.secondary}
          borderRadius="$lg"
          borderWidth={1}
          borderColor={Colors.border.light}
          p="$6"
          alignItems="center">
          <Heading size="sm" color={Colors.text.secondary} mb="$1">
            No reviews yet
          </Heading>
          <Text size="sm" color={Colors.text.secondary} textAlign="center">
            Be the first to review this Minibieb!
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default RatingSummary;
