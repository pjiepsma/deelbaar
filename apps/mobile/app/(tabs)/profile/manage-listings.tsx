import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '~/constants/Colors';
import { payloadClient } from '~/lib/api/PayloadClient';
import {
  PictureStatus,
  useListingPhotos,
  useMyListings,
  useReviewListingPhoto,
} from '~/lib/hooks/usePayloadQuery';
import { fileQueueManager } from '~/lib/storage/FileQueueManager';
import { sqliteManager } from '~/lib/storage/SQLiteManager';

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

type CreateListingModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const ManageListingsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [CreateListingModalComponent, setCreateListingModalComponent] =
    useState<ComponentType<CreateListingModalProps> | null>(null);
  const [createModalLoadFailed, setCreateModalLoadFailed] = useState(false);

  const { data: listings = [], isLoading, refetch } = useMyListings();

  useEffect(() => {
    import('~/components/CreateListingModal')
      .then((m) => setCreateListingModalComponent(() => m.default))
      .catch((err) => {
        console.warn('[ManageListings] CreateListingModal failed to load', err);
        setCreateModalLoadFailed(true);
      });
  }, []);

  const handleCreateSuccess = () => {
    refetch();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Mijn locaties</Text>

        <TouchableOpacity
          style={styles.toggleFormButton}
          onPress={() => {
            if (createModalLoadFailed) {
              Alert.alert(
                'Kaart niet beschikbaar',
                'De aanmaakwizard kon niet worden geladen. Voer een native rebuild uit: pnpm prebuild en daarna pnpm android.'
              );
              return;
            }
            setModalVisible(true);
          }}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.toggleFormButtonText}>Nieuwe locatie toevoegen</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : listings.length === 0 ? (
          <Text style={styles.emptyState}>
            Je hebt nog geen listings. Voeg er eentje toe om te beginnen.
          </Text>
        ) : (
          listings.map((listing) => (
            <ListingManagementCard key={listing.id} listing={listing as ListingItem} />
          ))
        )}
      </ScrollView>

      {CreateListingModalComponent ? (
        <CreateListingModalComponent
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={handleCreateSuccess}
        />
      ) : null}
    </>
  );
};

const ListingManagementCard = ({ listing }: { listing: ListingItem }) => {
  const [expanded, setExpanded] = useState(false);
  const [queuedPhotos, setQueuedPhotos] = useState<any[]>([]);
  const {
    data: pendingPhotos = [],
    isLoading: pendingLoading,
    refetch,
  } = useListingPhotos(listing.id, 'pending', { enabled: expanded });
  const reviewPhoto = useReviewListingPhoto();

  const locationSummary = useMemo(() => {
    const parts = [listing.location?.address].filter(Boolean);
    return parts.join(' · ');
  }, [listing.location]);

  // Load queued photos when expanded
  React.useEffect(() => {
    if (expanded) {
      const loadQueuedPhotos = async () => {
        try {
          const localListing = await sqliteManager.getListingById(listing.id);
          if (localListing?.pictures) {
            const queued = localListing.pictures.filter((pic: any) => pic.status === 'queued');
            setQueuedPhotos(queued);
          }
        } catch (error) {
          console.warn('[ListingManagementCard] Failed to load queued photos', error);
        }
      };
      loadQueuedPhotos();
    }
  }, [expanded, listing.id]);

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
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{listing.name}</Text>
          {locationSummary ? <Text style={styles.cardSubtitle}>{locationSummary}</Text> : null}
          {listing.category ? (
            <Text style={styles.cardCategory}>{`Type: ${listing.category}`}</Text>
          ) : null}
        </View>
        <View style={styles.cardActions}>
          <View style={styles.badgesContainer}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                {pendingPhotos.length + queuedPhotos.length}
              </Text>
            </View>
            <View
              style={[
                styles.publishStatusBadge,
                listing.publishStatus === 'live'
                  ? styles.publishStatusBadgeLive
                  : styles.publishStatusBadgeDraft,
              ]}>
              <Ionicons
                name={listing.publishStatus === 'live' ? 'globe-outline' : 'create-outline'}
                size={12}
                color="#fff"
              />
              <Text style={styles.publishStatusBadgeText}>
                {listing.publishStatus === 'live' ? 'Live' : 'Concept'}
              </Text>
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#333"
            style={{ marginLeft: 8 }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardExpandedContent}>
          <Text style={styles.pendingHeading}>Openstaande foto-aanvragen</Text>

          {/* Queued photos (offline uploads) */}
          {queuedPhotos.length > 0 && (
            <View style={styles.photoSection}>
              <Text style={styles.sectionHeading}>
                📱 Wachtende uploads ({queuedPhotos.length})
              </Text>
              <Text style={styles.sectionDescription}>
                Deze foto's worden automatisch geüpload zodra je weer online bent.
              </Text>
              {queuedPhotos.map((photo: any) => (
                <QueuedPhotoItem key={photo.id} photo={photo} />
              ))}
            </View>
          )}

          {/* Server pending photos */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionHeading}>
              ⏳ In afwachting van goedkeuring ({pendingPhotos.length})
            </Text>
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
          <Text style={styles.pendingDate}>
            {new Date(photo.createdAt).toLocaleString('nl-NL')}
          </Text>
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

const QueuedPhotoItem = ({ photo }: { photo: any }) => {
  // For queued photos, the photo field contains the file ID, not a media URL
  // We need to get the local file path from the fileQueueManager
  const queuedFile = fileQueueManager.getQueue().find((f) => f.id === photo.photo);
  const localImageUri = queuedFile?.uri;

  return (
    <View style={styles.queuedItem}>
      {localImageUri ? (
        <Image source={{ uri: localImageUri }} style={styles.pendingImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="image" size={24} color="#9ca3af" />
        </View>
      )}
      <View style={styles.pendingMeta}>
        <Text style={styles.pendingDescription}>Foto wacht op upload</Text>
        {photo.createdAt ? (
          <Text style={styles.pendingDate}>
            Opgeslagen: {new Date(photo.createdAt).toLocaleString('nl-NL')}
          </Text>
        ) : null}
        <View style={styles.queuedStatus}>
          <Ionicons name="cloud-upload-outline" size={16} color="#f59e0b" />
          <Text style={styles.queuedStatusText}>Wordt geüpload zodra online</Text>
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
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 8,
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
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  publishStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  publishStatusBadgeLive: {
    backgroundColor: '#22C55E',
  },
  publishStatusBadgeDraft: {
    backgroundColor: '#F59E0B',
  },
  publishStatusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardExpandedContent: {
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
  photoSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  queuedItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    opacity: 0.8,
  },
  placeholderImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  queuedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  queuedStatusText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
});

export default ManageListingsScreen;
