import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import ListingCard from '~/components/map/molecules/ListingCard';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { AddFavorite, RemoveFavorite } from '~/lib/powersync/Queries';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  category: string;
  listing: ListingRecord | null;
  listings: ListingRecord[];
  setListing: (state: ListingRecord | null) => void;
}

const defaultImage = require('~/assets/images/default-placeholder.png');

const ListingCarousel = ({ category, listing, listings, setListing }: Props) => {
  const carouselRef = useRef<ICarouselInstance>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { attachmentQueue, powersync } = useSystem();
  const { user } = useAuth();
  const router = useRouter();
  const baseOptions = {
    vertical: false,
    width: screenWidth * 0.9,
    height: 260,
  };

  useEffect(() => {
    setListing(listings[selectedIndex]);
  }, [selectedIndex]);

  useEffect(() => {
    if (listing) {
      const index = listings.findIndex((hike) => hike.id === listing.id);
      if (index !== -1) {
        scrollToIndex(index);
      }
      bottomSheetRef.current?.expand();
    }
  }, [listing]);

  useEffect(() => {
    if (listings) {
      scrollToIndex(0);
    }
  }, [listings]);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ index, animated: true });
    }
  };

  const removeFavorite = async (userId: string, listingId: string) => {
    const result = await powersync.execute(RemoveFavorite, [userId, listingId]);
    return result;
  };

  const handleRemoveFavorite = async (listingId: string) => {
    if (user?.id) {
      await removeFavorite(user.id, listingId);
    }
  };

  const addFavorite = async (userId: string, listingId: string) => {
    return await powersync.execute(AddFavorite, [userId, listingId]);
  };

  const handleAddFavorite = async (listingId: string) => {
    if (user?.id) {
      await addFavorite(user.id, listingId);
    }
  };

  const handleNavigate = (item) => {
    router.push({
      pathname: '/(modals)/listing/[id]', // Adjust this to your actual detail page path
      params: {
        id: item.id,
        dist_meters: item.dist_meters,
        lat: item.lat,
        long: item.long,
      },
    });
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['7%', '30%']}
      backgroundStyle={{ backgroundColor: '#f4f4e8' }}>
      <View style={styles.container}>
        <View style={styles.handleContainer}>
          <Text style={styles.handleText}>{listings.length} minibiebs</Text>
        </View>
        <Carousel
          key={listings.length} // Force re-render by updating the key
          {...baseOptions}
          loop={false}
          ref={carouselRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f4f4e8',
            justifyContent: 'center',
          }}
          data={listings}
          pagingEnabled
          onSnapToItem={(index: number) => setSelectedIndex(index)}
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              category={category}
              onPress={() => handleNavigate(item)}
              onAddFavorite={handleAddFavorite}
              onRemoveFavorite={handleRemoveFavorite}
            />
          )}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  handleContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Vertically centers the text
    justifyContent: 'center', // Horizontally centers the text
    backgroundColor: '#f4f4e8', // Background color for the handle area
    paddingBottom: 8,
  },
  handleText: {
    fontWeight: 'bold', // Makes the text bold
    fontSize: 16, // Adjust font size as needed
  },
  card: {
    backgroundColor: '#fff', // White background
    borderRadius: 10,
    padding: 10,
    margin: 5,
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
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
  userCount: {
    color: '#777',
    fontSize: 14,
  },
});

export default ListingCarousel;
