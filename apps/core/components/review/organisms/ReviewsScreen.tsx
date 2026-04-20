import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    const photoUri = null;

    return (
      <View key={item.id} style={{ marginBottom: 16, paddingBottom: 16 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <Avatar name={userName[0]?.toUpperCase() || 'A'} uri={avatarUri} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>{userName}</Text>
              <UserInfo
                userName={item.created_by}
                rating={item.rating}
                date={item.createdAt || item.created_at}
              />
            </View>
          </View>

          <ReviewText description={item.description} />

          {photoUri && (
            <Thumbnail
              uri={photoUri}
              onPress={() => {
                setSelectedImageUri(photoUri);
                setModalVisible(true);
              }}
            />
          )}
        </View>

        <View style={[styles.sep, { marginTop: 16 }]} />
      </View>
    );
  };

  return (
    <View style={{ gap: 16 }}>
      <SortOptions selectedSort={selectedSort} onSortChange={handleSortChange} />
      <View style={{ gap: 8 }}>
        {sortedReviews.length > 0 ? (
          sortedReviews.map(renderReview)
        ) : (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>No reviews to display</Text>
          </View>
        )}
      </View>
      <FullImageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        imageUri={selectedImageUri}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
  },
});

export default ReviewsScreen;
