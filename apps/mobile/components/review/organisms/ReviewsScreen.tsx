import { YStack, XStack, Text, Separator } from 'tamagui';
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
      <YStack key={item.id} marginBottom={16} paddingBottom={16}>
        <YStack gap={8}>
          {/* User Info & Rating */}
          <XStack gap={16} alignItems="flex-start">
            <Avatar name={userName[0]?.toUpperCase() || 'A'} uri={avatarUri} />
            <YStack flex={1} gap={4}>
              <Text fontSize={16} fontWeight="600">{userName}</Text>
              <UserInfo
                userName={item.created_by}
                rating={item.rating}
                date={item.createdAt || item.created_at}
              />
            </YStack>
          </XStack>

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
        </YStack>

        <Separator marginTop={16} />
      </YStack>
    );
  };

  return (
    <YStack gap={16}>
      <SortOptions selectedSort={selectedSort} onSortChange={handleSortChange} />
      <YStack gap={8}>
        {sortedReviews.length > 0 ? (
          sortedReviews.map(renderReview)
        ) : (
          <YStack padding={16} alignItems="center">
            <Text fontSize={14} color="#6b7280">
              No reviews to display
            </Text>
          </YStack>
        )}
      </YStack>
      <FullImageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        imageUri={selectedImageUri}
      />
    </YStack>
  );
};

export default ReviewsScreen;
