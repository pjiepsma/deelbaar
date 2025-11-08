import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '~/constants/Colors';
import {
  PictureStatus,
  useCreateListing,
  useListingPhotos,
  useMyListings,
  useReviewListingPhoto,
} from '~/lib/hooks/usePayloadQuery';
import { payloadClient } from '~/lib/api/PayloadClient';

const DEFAULT_CATEGORY_OPTIONS = [
  { label: 'Minibieb', value: 'minibieb' },
  { label: 'Watertappunt', value: 'water_point' },
  { label: 'Boerderijkraam', value: 'farm_stand' },
  { label: 'Overig', value: 'other' },
];

type ListingItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  location?: {
    address?: string;
    coordinates?: [number, number];
  };
};

type PictureRecord = {
  id: string;
  photo: any;
  created_by?: any;
  status?: PictureStatus;
  createdAt?: string;
};

const ManageListingsScreen = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY_OPTIONS[0].value);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const { data: listings = [], isLoading, refetch } = useMyListings();
  const createListing = useCreateListing();

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory(DEFAULT_CATEGORY_OPTIONS[0].value);
    setAddress('');
    setLatitude('');
    setLongitude('');
  };

  const handleCreateListing = async () => {
    if (!name.trim()) {
      Alert.alert('Naam verplicht', 'Geef de locatie een naam.');
      return;
    }

    const hasCoordinates = latitude && longitude;
    const location = {
      address: address || undefined,
      coordinates: hasCoordinates ? [Number(longitude), Number(latitude)] : undefined,
    };

    try {
      await createListing.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category,
        location,
      });
      resetForm();
      setFormOpen(false);
      refetch();
    } catch (error: any) {
      Alert.alert('Kon listing niet maken', error.message || 'Onbekende fout');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Mijn locaties</Text>

      <TouchableOpacity
        style={styles.toggleFormButton}
        onPress={() => setFormOpen((prev) => !prev)}>
        <Ionicons name={formOpen ? 'remove-circle-outline' : 'add-circle-outline'} size={20} color="#fff" />
        <Text style={styles.toggleFormButtonText}>
          {formOpen ? 'Annuleer' : 'Nieuwe listing toevoegen'}
        </Text>
      </TouchableOpacity>

      {formOpen && (
        <View style={styles.form}>
          <Text style={styles.label}>Naam</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Bijv. Minibieb aan de Dorpsstraat"
          />

          <Text style={styles.label}>Categorie</Text>
          <View style={styles.categoryRow}>
            {DEFAULT_CATEGORY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryChip,
                  category === option.value && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(option.value)}>
                <Text
                  style={[
                    styles.categoryChipText,
                    category === option.value && styles.categoryChipTextActive,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Beschrijving</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Vertel iets over deze locatie"
          />

          <Text style={styles.label}>Adres</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Straat, huisnummer, plaats"
          />

          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateInputWrapper}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
                placeholder="52.12345"
              />
            </View>
            <View style={styles.coordinateInputWrapper}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
                placeholder="5.67890"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, createListing.isPending && styles.primaryButtonDisabled]}
            onPress={handleCreateListing}
            disabled={createListing.isPending}>
            {createListing.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Opslaan</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : listings.length === 0 ? (
        <Text style={styles.emptyState}>Je hebt nog geen listings. Voeg er eentje toe om te beginnen.</Text>
      ) : (
        listings.map((listing) => (
          <ListingManagementCard key={listing.id} listing={listing as ListingItem} />
        ))
      )}
    </ScrollView>
  );
};

const ListingManagementCard = ({ listing }: { listing: ListingItem }) => {
  const [expanded, setExpanded] = useState(false);
  const { data: pendingPhotos = [], isLoading: pendingLoading, refetch } = useListingPhotos(
    listing.id,
    'pending',
    { enabled: expanded }
  );
  const reviewPhoto = useReviewListingPhoto();

  const locationSummary = useMemo(() => {
    const parts = [listing.location?.address].filter(Boolean);
    return parts.join(' · ');
  }, [listing.location]);

  const handleReview = async (
    pictureId: string,
    status: Exclude<PictureStatus, 'pending'>,
    rejectionReason?: string
  ) => {
    try {
      await reviewPhoto.mutateAsync({
        pictureId,
        listingId: listing.id,
        status,
        rejectionReason,
      });
      refetch();
      Alert.alert(
        status === 'approved' ? 'Goedgekeurd' : 'Afgewezen',
        status === 'approved'
          ? 'De foto is nu zichtbaar bij de listing.'
          : 'De indiener krijgt te zien dat de foto is afgewezen.'
      );
    } catch (error: any) {
      Alert.alert('Actie mislukt', error.message || 'Onbekende fout');
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded((prev) => !prev)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{listing.name}</Text>
          {locationSummary ? <Text style={styles.cardSubtitle}>{locationSummary}</Text> : null}
          {listing.category ? <Text style={styles.cardCategory}>{`Type: ${listing.category}`}</Text> : null}
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingPhotos.length}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#333"
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardContent}>
          <Text style={styles.pendingHeading}>Openstaande foto-aanvragen</Text>
          {pendingLoading ? (
            <ActivityIndicator />
          ) : pendingPhotos.length === 0 ? (
            <Text style={styles.emptyStateSmall}>Geen pending foto’s voor deze listing.</Text>
          ) : (
            pendingPhotos.map((photo: PictureRecord) => (
              <PendingPhotoItem
                key={photo.id}
                photo={photo}
                onApprove={() => handleReview(photo.id, 'approved')}
                onReject={() => handleReview(photo.id, 'rejected')}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
};

const PendingPhotoItem = ({
  photo,
  onApprove,
  onReject,
}: {
  photo: PictureRecord;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const mediaId = typeof photo.photo === 'string' ? photo.photo : photo.photo?.id;
  const imageUrl = mediaId ? payloadClient.getFileUrl(mediaId) : undefined;
  const submittedBy =
    typeof photo.created_by === 'string' ? photo.created_by : photo.created_by?.email;

  return (
    <View style={styles.pendingItem}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.pendingImage} /> : null}
      <View style={styles.pendingMeta}>
        <Text style={styles.pendingDescription}>
          Ingediend door {submittedBy || 'Onbekende gebruiker'}
        </Text>
        {photo.createdAt ? (
          <Text style={styles.pendingDate}>{new Date(photo.createdAt).toLocaleString('nl-NL')}</Text>
        ) : null}
        <View style={styles.pendingActions}>
          <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={onApprove}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Goedkeuren</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={onReject}>
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Afwijzen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  toggleFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  toggleFormButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInputWrapper: {
    flex: 1,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 40,
    textAlign: 'center',
    color: '#666',
  },
  emptyStateSmall: {
    color: '#666',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#666',
    marginTop: 4,
  },
  cardCategory: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  pendingBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  cardContent: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  pendingHeading: {
    fontWeight: '600',
    marginBottom: 12,
  },
  pendingItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pendingImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  pendingMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pendingDescription: {
    fontWeight: '500',
  },
  pendingDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  approveButton: {
    backgroundColor: '#3BA55C',
  },
  rejectButton: {
    backgroundColor: '#CC4C4C',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    color: '#333',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ManageListingsScreen;


