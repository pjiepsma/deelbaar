import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Heading,
  Box,
  Progress,
  ProgressFilledTrack,
} from '@gluestack-ui/themed';

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
      <Text key={i} size="sm">
        {i < Math.floor(rating) ? '⭐' : '☆'}
      </Text>
    ));
  };

  return (
    <VStack space="md">
      <Heading size="lg" color="#6B8E23">Reviews</Heading>
      
      {totalReviews > 0 ? (
        <HStack space="lg" alignItems="flex-start">
          {/* Left: Average Rating */}
          <VStack space="xs" alignItems="center" minWidth={100}>
            <Heading size="3xl" color="#6B8E23">
              {averageRating}
            </Heading>
            <HStack space="2xs">
              {renderStars(averageRating)}
            </HStack>
            <Text size="sm" color="$coolGray600">
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
                  <Text size="xs" color="$coolGray600" minWidth={30}>
                    {star} ⭐
                  </Text>
                  <Progress value={percentage} w="$full" size="sm">
                    <ProgressFilledTrack bg="#6B8E23" />
                  </Progress>
                  <Text size="xs" color="$coolGray500" minWidth={24}>
                    {count}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </HStack>
      ) : (
        <Box bg="#F5F5DC" p="$6" borderRadius="$lg" alignItems="center">
          <Text size="2xl" mb="$2">📚</Text>
          <Heading size="sm" color="#6B8E23" mb="$1">
            No reviews yet
          </Heading>
          <Text size="sm" color="$coolGray600" textAlign="center">
            Be the first to review this Minibieb!
          </Text>
        </Box>
      )}
    </VStack>
  );
};

export default RatingSummary;
