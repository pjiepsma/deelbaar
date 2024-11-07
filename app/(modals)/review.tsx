import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerResult, ImagePickerSuccessResult } from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Button,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import RatingScreen from '~/components/review/organisms/RatingScreen';
import { useSystem } from '~/lib/powersync/PowerSync';
import { InsertPicture, InsertReview } from '~/lib/powersync/Queries';

const isAndroid = Platform.OS === 'android';

const ReviewComponent: React.FC = () => {
  const [description, setDescription] = useState<string>('');
  const { id, rating: localRating } = useLocalSearchParams<{
    id: string;
    rating: string;
  }>();
  const [rating, setRating] = useState(localRating);
  const { connector, powersync, attachmentQueue } = useSystem();
  const [image, setImage] = useState<ImagePickerSuccessResult | null>(null);
  const router = useRouter();

  const submitReview = async (): Promise<void> => {
    const { userID } = await connector.fetchCredentials();
    const res = await powersync.execute(InsertReview, [rating, description, userID, id]);
    const review = res.rows?.item(0);
    if (!review) {
      throw new Error('Could not create review');
    }

    if (image) {
      await savePhoto(id, userID, review.id, image);
    }
    router.back();
  };

  const captureImageAsync = async () => {
    const options = {
      base64: true,
      quality: 0.5,
      skipProcessing: isAndroid,
    };
    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      setImage(result);
    }
  };

  const savePhoto = async (
    listingID: string,
    userID: string,
    reviewID: string,
    result: ImagePickerResult
  ) => {
    const { id: photoID } = await attachmentQueue!.savePhoto(result.assets![0].base64!);
    console.log('Insert picture: ', userID, listingID, photoID, reviewID);
    const res = await powersync.execute(InsertPicture, [userID, listingID, photoID, reviewID]);
    const resultRecord = res.rows?.item(0);

    if (!resultRecord) {
      throw new Error('Could not create picture');
    }
    return resultRecord.id;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HAPS Dorp</Text>
      <View style={styles.profileWrapper}>
        {image && (
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }} // User profile image placeholder
            style={styles.profileImage}
          />
        )}
        <Text style={styles.profileText}>Pieter Iepsma</Text>
      </View>
      <RatingScreen setRating={setRating} rating={rating} />
      <TextInput
        style={styles.textInput}
        placeholder="Share details of your own experience at this place"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TouchableOpacity style={styles.addPhotoButton} onPress={captureImageAsync}>
        <FontAwesome name="camera" size={20} color="blue" />
        <Text style={styles.addPhotoText}>Add photos</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image.assets[0].uri }} style={styles.photoPreview} />}
      <Button title="Post" onPress={submitReview} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profileText: {
    fontSize: 16,
    color: '#666',
  },
  starsWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  star: {
    marginHorizontal: 5,
  },
  textInput: {
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addPhotoText: {
    marginLeft: 10,
    color: 'blue',
  },
  photoPreview: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
});

export default ReviewComponent;
