import BottomSheet from '@gorhom/bottom-sheet';
import { usePowerSync } from '@powersync/react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerResult } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord, PICTURE_TABLE } from '~/lib/powersync/AppSchema';
import { system, useSystem } from '~/lib/powersync/PowerSync';
import { toAttachmentRecord } from '~/lib/util/util';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  listing: ListingRecord | null;
  listings: ListingRecord[];
  setListing: (state: ListingRecord | null) => void;
}

const defaultImage = require('assets/images/default-placeholder.png');

const HikeCarousel = ({ listing, listings, setListing }: Props) => {
  const carouselRef = useRef<ICarouselInstance>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { attachmentQueue } = useSystem();
  const powerSync = usePowerSync();
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
      console.log('scroll to start');
    }
  }, [listings]);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ index });
      console.log(carouselRef.current.getCurrentIndex());
    }
  };

  const handleClose = () => {
    bottomSheetRef.current?.close();
  };

  const savePhoto = async (listingID: string, data: ImagePickerResult) => {
    const { id: photoID } = await attachmentQueue!.savePhoto(data.assets![0].base64!);
    const { userID } = await system.connector.fetchCredentials();
    try {
      const res = await powerSync.execute(
        `INSERT INTO ${PICTURE_TABLE}
                     (id, created_at, created_by, listing_id, photo_id)
                 VALUES (uuid(), datetime(), ?, ?, ?)`,
        [userID, listingID!, photoID]
      );
      console.log('Insert successful:', res);
    } catch (e) {
      console.error('Insert picture error:', e);
    }
  };

  const HikeItem = React.memo(({ item }: { item: ListingRecord }) => {
    const isAndroid = Platform.OS === 'android';

    const captureImageAsync = async () => {
      if (user) {
        const options = {
          base64: true,
          quality: 0.5,
          skipProcessing: isAndroid,
        };
        const photo = await ImagePicker.launchImageLibraryAsync(options);
        await savePhoto(item.id, photo);
      } else {
        router.replace('/(modals)/login');
      }
    };

    const latestPicture = item.picture && item.picture ? item.picture : null;
    const photoAttachment = latestPicture ? toAttachmentRecord(latestPicture) : null;
    const uri = system.attachmentQueue?.getLocalUri(photoAttachment?.local_uri!);

    const handleNavigate = () => {
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
      <TouchableOpacity onPress={handleNavigate} style={styles.card} activeOpacity={0.9}>
        <View style={styles.firstRow}>
          <FastImage
            key={photoAttachment?.id}
            source={photoAttachment ? { uri, priority: FastImage.priority.normal } : defaultImage}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>{item.description}</Text>
        </View>

        <View style={styles.secondRow}>
          <Text style={styles.subtitle}>1 h 03</Text>
          <Text style={styles.subtitle}>4,18 km</Text>
          <Text style={styles.subtitle}>10 m</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.bottomContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Easy</Text>
          </View>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ 3.0</Text>
            <Text style={styles.userCount}>11 users</Text>
          </View>
        </View>

        {/*<TouchableOpacity style={styles.closeButton} onPress={captureImageAsync}>*/}
        {/*  <Ionicons name="camera-outline" size={25} color="#f4f4e8" />*/}
        {/*</TouchableOpacity>*/}
      </TouchableOpacity>
    );
  });

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
          renderItem={({ item }) => <HikeItem item={item} />}
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
    flex: 1, // Take up the rest of the row
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

export default HikeCarousel;
