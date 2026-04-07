import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text, Button, H2 } from 'tamagui';
import { useNetInfo } from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import RatingScreen from '~/components/review/organisms/RatingScreen';
import { useCreateReview } from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';

type ReviewParams = {
  id?: string;
  title?: string;
  name?: string;
  rating?: string;
};

export default function ReviewModal() {
  const params = useLocalSearchParams<ReviewParams>();
  const router = useRouter();
  const { user } = useAuth();
  const netInfo = useNetInfo();

  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(params.rating ? Number(params.rating) : 0);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createReview = useCreateReview();

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Toestemming vereist',
          'Geef toegang tot je foto’s om een afbeelding toe te voegen.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.warn('[ReviewModal] Image picker failed', error);
      Alert.alert('Fout', 'Kon geen afbeelding kiezen.');
    }
  };

  const handleRemoveImage = () => setPhoto(null);

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Inloggen vereist', 'Log in om een review te plaatsen.');
      return;
    }

    if (!params.id) {
      Alert.alert('Onbekende listing', 'De listing kon niet worden gevonden.');
      return;
    }

    if (!rating) {
      Alert.alert('Beoordeling ontbreekt', 'Geef een beoordeling met minimaal één ster.');
      return;
    }

    setSubmitting(true);

    try {
      await createReview.mutateAsync({
        rating,
        description: description.trim(),
        listing: params.id,
        photos: photo
          ? [
              {
                uri: photo.uri,
                type: photo.mimeType || 'image/jpeg',
                name:
                  photo.fileName ||
                  photo.uri.split('/').pop() ||
                  `review-photo-${Date.now()}.${photo.mimeType?.split('/')[1] || 'jpg'}`,
              },
            ]
          : undefined,
      });

      const online = netInfo.isConnected ?? true;
      Alert.alert(
        'Bedankt!',
        online
          ? 'Je review is opgeslagen en wordt snel verwerkt.'
          : 'Je review wordt verstuurd zodra je weer online bent.'
      );
      router.back();
    } catch (error: any) {
      console.error('[ReviewModal] Failed to create review', error);
      Alert.alert('Fout', error?.message || 'Kon review niet opslaan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <YStack gap={24}>
          <YStack gap={8}>
            <H2 fontSize={20} fontWeight="600">{params.title || 'Deel je ervaring'}</H2>
            <Text color="#6b7280" fontSize={14}>Door: {params.name || user?.email || 'Jij'}</Text>
          </YStack>

          <YStack gap={8}>
            <Text fontSize={16} fontWeight="600" marginBottom={8}>Beoordeling</Text>
            <RatingScreen rating={rating} setRating={setRating} />
          </YStack>

          <YStack gap={8}>
            <Text fontSize={16} fontWeight="600" marginBottom={8}>Beschrijving</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Vertel iets over je bezoek aan deze locatie"
              multiline
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
            />
            <Text color="#6b7280" fontSize={12} marginTop={4}>
              {description.length}/1000
            </Text>
          </YStack>

          <YStack gap={16}>
            <Text fontSize={16} fontWeight="600">Foto</Text>
            {photo ? (
              <YStack>
                <Image source={{ uri: photo.uri }} style={styles.preview} />
                <Pressable onPress={handleRemoveImage} style={styles.removeButton}>
                  <XStack gap={8} alignItems="center">
                    <Ionicons name="trash-outline" size={16} color="#d946ef" />
                    <Text color="#d946ef" fontWeight="600">Verwijder foto</Text>
                  </XStack>
                </Pressable>
              </YStack>
            ) : (
              <Button variant="outline" borderColor="#0a84ff" onPress={handlePickImage}>
                <XStack gap={8} alignItems="center">
                  <Ionicons name="camera-outline" size={18} color="#0a84ff" />
                  <Text color="#0a84ff" fontSize={14} fontWeight="600">Voeg foto toe</Text>
                </XStack>
              </Button>
            )}
          </YStack>

          <Button onPress={handleSubmit} disabled={submitting}>
            <Text color="white" fontSize={16} fontWeight="600">{submitting ? 'Versturen…' : 'Plaats review'}</Text>
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24,
  },
  textInput: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
});
