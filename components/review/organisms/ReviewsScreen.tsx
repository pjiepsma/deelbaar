import { VStack, HStack, Text, Heading, Box, Divider } from '@gluestack-ui/themed';
import React, { useState } from 'react';

import Avatar from '../atom/Avatar';
import FullImageModal from '../atom/FullImageModal';
import ReviewText from '../atom/ReviewText';
import SortOptions from '../atom/SortOptions';
import Thumbnail from '../atom/Thumbnail';
import UserInfo from '../atom/UserInfo';

interface Review {
  id: string;
  created_by: any;
  rating: number;
  createdAt?: string;
  created_at?: string;
  description: string;
  name?: string;
}

interface Image {
  review_id: string;
  local_uri: string;
}

interface ReviewsScreenProps {
  reviews: Review[];
  images: Image[];
}

const ReviewsScreen: React.FC<ReviewsScreenProps> = ({ reviews }) => {
  const [selectedSort, setSelectedSort] = useState('Newest');
  const [sortedReviews, setSortedReviews] = useState(reviews);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const handleSortChange = (option: string) => {
    setSelectedSort(option);
    // TODO: Implement sorting logic
  };

  const renderReview = (item: Review) => {
    const userName = item.name || item.created_by?.name || item.created_by?.email || 'Anonymous';
    const avatarUri = item.created_by?.avatar?.url || null;
    const photoUri = null; // TODO: Implement photo loading

    return (
      <Box key={item.id} mb="$4" pb="$4">
        <VStack space="sm">
          {/* User Info & Rating */}
          <HStack space="md" alignItems="flex-start">
            <Avatar name={userName[0]?.toUpperCase() || 'A'} uri={avatarUri} />
            <VStack flex={1} space="2xs">
              <Heading size="sm">{userName}</Heading>
              <UserInfo
                userName={item.created_by}
                rating={item.rating}
                date={item.createdAt || item.created_at}
              />
            </VStack>
          </HStack>

          {/* Review Text */}
          <ReviewText description={item.description} />

          {/* Photo if exists */}
          {photoUri && (
            <Thumbnail
              uri={photoUri}
              onPress={() => {
                setSelectedImageUri(photoUri);
                setModalVisible(true);
              }}
            />
          )}
        </VStack>

        <Divider mt="$4" />
      </Box>
    );
  };

  return (
    <VStack space="md">
      <SortOptions selectedSort={selectedSort} onSortChange={handleSortChange} />
      <VStack space="sm">
        {sortedReviews.length > 0 ? (
          sortedReviews.map(renderReview)
        ) : (
          <Box p="$4" alignItems="center">
            <Text size="sm" color="$coolGray500">
              No reviews to display
            </Text>
          </Box>
        )}
      </VStack>
      <FullImageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        imageUri={selectedImageUri}
      />
    </VStack>
  );
};

export default ReviewsScreen;
