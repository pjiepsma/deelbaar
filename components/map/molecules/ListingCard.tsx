import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { system } from '~/lib/powersync/PowerSync';
import { toAttachmentRecord } from '~/lib/util/util';

interface HikeItemProps {
  item: ListingRecord;
  category: string;
  onPress: () => void;
  onAddFavorite: (id: string) => void;
  onRemoveFavorite: (id: string) => void;
}

const ListingCard: React.FC<HikeItemProps> = ({
  item,
  category,
  onPress,
  onAddFavorite,
  onRemoveFavorite,
}) => {
  const latestPicture = item?.picture ? item.picture : null;
  const photoAttachment = latestPicture ? toAttachmentRecord(latestPicture) : null;
  const uri = system.attachmentQueue?.getLocalUri(photoAttachment?.local_uri!);
  const distanceInKm = item?.dist_meters ? (item.dist_meters / 1000).toFixed(1) : '0';
  const numericRating = item?.rating ? Number(item.rating) : 0;
  const isFavorite = item?.favorite; // Assuming `isFavorite` is a property of `item`
  const { user } = useAuth();
  const handleFavoritePress = () => {
    if (isFavorite) {
      onRemoveFavorite(item.id);
    } else {
      onAddFavorite(item.id);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.9}>
      <View style={styles.firstRow}>
        <FastImage
          key={photoAttachment?.id}
          source={
            photoAttachment
              ? {
                  uri,
                  priority: FastImage.priority.normal,
                }
              : require('assets/images/default-placeholder.png')
          }
          style={styles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>{item.description}</Text>
        </View>
        {user && (
          <TouchableOpacity onPress={handleFavoritePress} style={styles.favoriteIcon}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? 'red' : 'gray'}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.secondRow}>
        <Text style={styles.subtitle}>{distanceInKm}km</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.bottomContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{category}</Text>
        </View>

        {numericRating !== 0 && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {numericRating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  firstRow: {
    flexDirection: 'row',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  subtitle: {
    color: '#777',
    fontSize: 14,
  },
  separator: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    marginVertical: 8,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  label: {
    color: '#00796B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    marginRight: 5,
  },
});

export default ListingCard;
