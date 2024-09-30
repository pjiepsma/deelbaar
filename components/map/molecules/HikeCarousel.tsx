import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { ATTACHMENT_TABLE } from '@powersync/attachments';
import { usePowerSync, useQuery } from '@powersync/react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerResult } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  ListRenderItem,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'react-native-elements';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import { useAuth } from '~/lib/AuthProvider';
import { LISTING_TABLE, ListingRecord, PICTURE_TABLE } from '~/lib/powersync/AppSchema';
import { system, useSystem } from '~/lib/powersync/PowerSync';
import { PictureEntry } from '~/lib/types/types';
import { toAttachmentRecord } from '~/lib/util/util';

const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_IMAGES = [
  { uri: 'https://example.com/default1.jpg', date: 'No Date' },
  { uri: 'https://example.com/default2.jpg', date: 'No Date' },
  { uri: 'https://example.com/default3.jpg', date: 'No Date' },
];

// Type for the hike object
interface Hike {
  id: number;
  title: string;
  description: string;
  time: string;
  tags: string;
  images: string[];
}

const listings: Hike[] = [
  {
    id: 1,
    title: 'Royal Dutch Touring Club route',
    description: '12.6 km',
    time: '3h 15m',
    tags: 'Duo',
    images: [
      'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGhpa2V8ZW58MHx8fHwxNjI2NTUyNjcy&ixlib=rb-1.2.1&q=80&w=1080',
      'https://images.unsplash.com/photo-1476610182048-b716b8518aae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGhpa2V8ZW58MHx8fHwxNjI2NTUyNjcy&ixlib=rb-1.2.1&q=80&w=1080',
      'https://images.unsplash.com/photo-1533758116473-6b9b1463f11d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDR8fGhpa2V8ZW58MHx8fHwxNjI2NTUyNjcy&ixlib=rb-1.2.1&q=80&w=1080',
    ],
  },
  {
    id: 2,
    title: 'Mountain Trail Adventure',
    description: '8.2 km',
    time: '2h 30m',
    tags: 'Dutch',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDh8fGhpa2V8ZW58MHx8fHwxNjI2NTUyNjcy&ixlib=rb-1.2.1&q=80&w=1080',
      'https://images.unsplash.com/photo-1516569422907-3d13fbf07ffb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDkxfGhpa2V8ZW58MHx8fHwxNjI2NTUyNjcy&ixlib=rb-1.2.1&q=80&w=1080',
    ],
  },
  {
    id: 3,
    title: 'Forest Escape',
    description: '15.0 km',
    time: '4h 15m',
    tags: 'Children',
    images: [
      'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDE1fHxoaWtlfGVufDB8fHx8MTYyNjU1MjY3Mg&ixlib=rb-1.2.1&q=80&w=1080',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDI2fHxoaWtlfGVufDB8fHx8MTYyNjU1MjY3Mg&ixlib=rb-1.2.1&q=80&w=1080',
      'https://images.unsplash.com/photo-1484910292437-025e5d13ce87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDIwfHxoaWtlfGVufDB8fHx8MTYyNjU1MjY3Mg&ixlib=rb-1.2.1&q=80&w=1080',
    ],
  },
];

interface Props {
  listing: ListingRecord | null;
  listings: ListingRecord[];
  setListing: (state: ListingRecord | null) => void;
}

const HikeCarousel = ({ listing, listings, setListing }: Props) => {
  const carouselRef = useRef<Carousel>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { connector, powersync, attachmentQueue } = useSystem();
  const powerSync = usePowerSync();

  const scrollToItem = (id: string) => {
    const index = listings.findIndex((hike) => hike.id === id);
    if (index !== -1) {
      carouselRef.current?.scrollToIndex(index);
    }
  };

  interface ImagesViewProps {
    id: string;
  }

  const { user, signIn, signOut } = useAuth();
  const router = useRouter();

  const createNewTodo = async (listingID: string) => {
    const { userID } = await system.connector.fetchCredentials(); // always call fetchCredentials might be the key?

    await powerSync.execute(
      `INSERT INTO ${PICTURE_TABLE}
                 (id, created_at, created_by, listing_id)
             VALUES (uuid(), datetime(), ?, ?)`,
      [userID, listingID!]
    );
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

  const renderImageItem: ListRenderItem<any> = ({ item }) => {
    const photoAttachment = toAttachmentRecord(item);
    return (
      <View key={photoAttachment?.id} style={styles.imageWrapper}>
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
      </View>
    );
  };

  const HikeItem = ({ item }: { item: ListingRecord }) => {
    const { data: pictures, isLoading } = useQuery<PictureEntry>(
      `
                SELECT ${PICTURE_TABLE}.id    AS picture_id,
                       ${PICTURE_TABLE}.*,
                       ${ATTACHMENT_TABLE}.id AS attachment_id,
                       ${ATTACHMENT_TABLE}.*
                FROM ${PICTURE_TABLE}
                         LEFT JOIN
                     ${LISTING_TABLE} ON ${PICTURE_TABLE}.listing_id = ${LISTING_TABLE}.id
                         LEFT JOIN
                     ${ATTACHMENT_TABLE} ON ${PICTURE_TABLE}.photo_id = ${ATTACHMENT_TABLE}.id
                WHERE ${PICTURE_TABLE}.listing_id = ?`,
      [item.id]
    );
    const images =
      pictures.length >= 3 ? pictures : [...pictures, ...DEFAULT_IMAGES.slice(pictures.length)];

    const isAndroid = Platform.OS === 'android';

    const captureImageAsync = async () => {
      if (user) {
        const options = {
          base64: true,
          quality: 0.5,
          skipProcessing: isAndroid,
        };
        const photo = await ImagePicker.launchImageLibraryAsync(options);
        // await savePhoto(item.id, photo);
        await savePhoto(item.id, photo);
        // await createListing();
      } else {
        router.replace('/(modals)/login');
      }
    };

    const [imageIndex, setImageIndex] = useState<number>(0);

    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={captureImageAsync}>
            <Ionicons name="camera-outline" size={25} color="#f4f4e8" />
          </TouchableOpacity>
          {images.length > 0 && (
            <View>
              <Carousel
                loop
                width={screenWidth * 0.75}
                height={150}
                autoPlay={false}
                data={images}
                renderItem={renderImageItem}
                onSnapToItem={(index) => setImageIndex(index)}
                vertical={false}
              />
              {/* Pagination Dots */}
              {images.length > 1 && (
                <View style={styles.paginationContainer}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, { opacity: i === imageIndex ? 1 : 0.3 }]} />
                  ))}
                </View>
              )}
            </View>
          )}
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.details}>{item.description}</Text>
          <Text style={styles.details}>{item.description}</Text>
        </View>
      </View>
    );
  };

  // Custom handle component
  // @ts-ignore
  const CustomHandle = ({ numberOflistings, onClose }) => {
    return (
      <View style={styles.handleContainer}>
        <Text style={styles.hikeCount}>{numberOflistings} listings</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-outline" size={25} color="#f4f4e8" />
        </TouchableOpacity>
      </View>
    );
  };

  const colors = ['#26292E', '#899F9C', '#B3C680', '#5C6265', '#F5D399', '#F1F1F1'];
  const [data, setData] = React.useState([...new Array(6).keys()]);
  const [isFast, setIsFast] = React.useState(false);
  const [isAutoPlay, setIsAutoPlay] = React.useState(false);
  const [isPagingEnabled, setIsPagingEnabled] = React.useState(true);
  const ref = React.useRef<ICarouselInstance>(null);

  const handleClose = () => {
    bottomSheetRef.current?.close();
  };

  const baseOptions = {
    vertical: false,
    width: screenWidth * 0.85,
    height: screenWidth / 2,
  } as const;
  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['8%', '45%']}
      handleComponent={() => (
        <CustomHandle numberOflistings={listings.length} onClose={handleClose} />
      )}>
      <View style={styles.container}>
        <Carousel
          {...baseOptions}
          loop
          ref={ref}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f4f4e8',
            justifyContent: 'center',
          }}
          autoPlay={isAutoPlay}
          autoPlayInterval={isFast ? 100 : 2000}
          data={listings}
          pagingEnabled={isPagingEnabled}
          onSnapToItem={(index: number) => setSelectedIndex(index)}
          renderItem={({ item }) => <HikeItem item={item} />}
        />
      </View>
    </BottomSheet>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: 'red',
  },
  card: {
    backgroundColor: 'white', // Set the background color
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    alignItems: 'center', // Center contents in the card
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'black',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  details: {
    fontSize: 14,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  hikeCount: {
    fontSize: 18,
  },
  carousel: {
    overflow: 'visible',
  },
  handleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f4f4e8',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#797a74',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    backgroundColor: 'blue',
    height: 200,
    width: 200,
  },
});

export default HikeCarousel;
