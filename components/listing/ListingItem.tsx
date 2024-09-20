import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@powersync/react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'react-native-elements';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { ListingRecord } from '~/lib/powersync/AppSchema';
import { system } from '~/lib/powersync/PowerSync';
import { SelectPictures } from '~/lib/powersync/Queries';
import { PictureEntry } from '~/lib/types/types';
import { toAttachmentRecord } from '~/lib/util/util';

const DEFAULT_IMAGES = [
  { uri: 'https://example.com/default1.jpg', date: 'No Date' },
  { uri: 'https://example.com/default2.jpg', date: 'No Date' },
  { uri: 'https://example.com/default3.jpg', date: 'No Date' },
];

interface Props {
  listing: ListingRecord;
  setListing: (state: ListingRecord | null) => void;
}

export const ListingItem = ({ listing, setListing }: Props) => {
  const { data: pictures, isLoading } = useQuery<PictureEntry>(SelectPictures, [listing.id]);
  const images =
    pictures.length >= 3 ? pictures : [...pictures, ...DEFAULT_IMAGES.slice(pictures.length)];
  const distance = (Number(listing.dist_meters) / 1000).toFixed(1);

  const PicturesView = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
        {images.map((image, index) => {
          const photoAttachment = toAttachmentRecord(image);
          return (
            <View key={index} style={styles.imageWrapper}>
              {photoAttachment?.local_uri ? (
                <Image
                  source={{ uri: system.attachmentQueue?.getLocalUri(photoAttachment.local_uri) }}
                  style={styles.image}
                />
              ) : (
                <View>
                  <Text>No Image Available</Text>
                </View>
              )}
              <View style={styles.overlay}>
                <Text style={styles.dateText}>{image.date}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <TouchableOpacity onPress={() => setListing(listing)}>
      <Animated.View style={styles.listing} entering={FadeInRight} exiting={FadeOutLeft}>
        <View style={styles.card}>
          <PicturesView />
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{listing.name}</Text>
            <View style={styles.row}>
              <Text style={styles.distance}>{` • ${distance} km`}</Text>
            </View>
            <Text style={styles.details}>{listing.description}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button}>
              <Ionicons name="navigate-outline" size={20} color="#007aff" />
              <Text style={styles.buttonText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <Ionicons name="share-outline" size={20} color="#007aff" />
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listing: {
    // padding: 16,
    // gap: 10,
    // marginVertical: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    paddingHorizontal: 4,
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
  },
  infoContainer: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: '#555',
  },
  distance: {
    color: '#888',
  },
  details: {
    marginTop: 4,
    color: '#777',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  buttonText: {
    marginLeft: 6,
    color: '#007aff',
    fontWeight: '600',
  },
});
