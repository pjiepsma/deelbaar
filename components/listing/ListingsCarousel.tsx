import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ListingRecord } from '~/lib/powersync/AppSchema';

// Define props for the ListingsCarousel component
interface ListingsCarouselProps {
  listings: ListingRecord[];
  onClose: () => void;
}

// Card component to display each listing
const Card: React.FC<{ listing: ListingRecord }> = ({ listing }) => (
  <View style={styles.card}>
    {/*<Image source={{ uri: listing.image }} style={styles.cardImage} />*/}
    <Text style={styles.cardTitle}>{listing.name}</Text>
    <Text style={styles.cardDescription}>{listing.description}</Text>
    <Text style={styles.cardDistance}>{listing.dist_meters} away</Text>
    <View style={styles.tagsContainer}>
      {listing.photo_ids.map((tag, index) => (
        <Text key={index} style={styles.tag}>
          {tag}
        </Text>
      ))}
    </View>
  </View>
);

const ListingsCarousel: React.FC<ListingsCarouselProps> = ({ listings, onClose }) => {
  const snapPoints = useMemo(() => [`25%`], []);
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      style={styles.sheetContainer}>
      <View style={styles.header}>
        <Text style={styles.listingCount}>{listings.length} Listings</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {listings.map((listing) => (
          <Card key={listing.id} listing={listing} />
        ))}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: -2,
    },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  listingCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  card: {
    width: 200,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  cardDistance: {
    fontSize: 12,
    color: '#999',
    marginVertical: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 12,
  },
});

export default ListingsCarousel;
