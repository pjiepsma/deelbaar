import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Avatar from '../atom/Avatar';
import FullImageModal from '../atom/FullImageModal';
import ReviewText from '../atom/ReviewText';
import SortOptions from '../atom/SortOptions';
import ThumbnailImage from '../atom/ThumbnailImage';
import UserInfo from '../atom/UserInfo';

import { useSystem } from '~/lib/powersync/PowerSync';

interface Review {
  id: string;
  created_by: string;
  rating: number;
  created_at: string;
  description: string;
}

interface Image {
  review_id: string;
  local_uri: string;
}

interface ReviewsScreenProps {
  reviews: Review[];
  images: Image[];
}

const ReviewsScreen: React.FC<ReviewsScreenProps> = ({ reviews, images }) => {
  const [selectedSort, setSelectedSort] = useState('Most relevant');
  const [sortedReviews, setSortedReviews] = useState(reviews);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const { attachmentQueue } = useSystem();

  const handleSortChange = (option: string) => {
    setSelectedSort(option);
    // Sorting logic
  };

  const renderReview = (item: Review) => {
    const image = images.find((img) => img.review_id === item.id);
    const uri = image ? attachmentQueue?.getLocalUri(image.local_uri) : null;

    return (
      <View key={item.id} style={styles.reviewContainer}>
        <View style={styles.userDetails}>
          <Avatar profile="A" userName={item.id} />
          <UserInfo userName={item.created_by} rating={item.rating} date={item.created_at} />
        </View>
        <ReviewText description={item.description} />
        {uri && (
          <ThumbnailImage
            uri={uri}
            onPress={() => {
              setSelectedImageUri(uri);
              setModalVisible(true);
            }}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <SortOptions selectedSort={selectedSort} onSortChange={handleSortChange} />
        <View>{sortedReviews.map(renderReview)}</View>
      </ScrollView>
      <FullImageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        imageUri={selectedImageUri}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  reviewContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  userDetails: {
    flexDirection: 'column',
    marginBottom: 8,
  },
});

export default ReviewsScreen;
