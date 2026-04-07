import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';

import Colors from '~/constants/Colors';
import {
  usePendingProductOfferings,
  useApproveProductOffering,
} from '~/lib/hooks/useProductOfferings';

interface ProductApprovalCenterProps {
  listingId: string;
  listingName: string;
  onClose: () => void;
}

export default function ProductApprovalCenter({
  listingId,
  listingName,
  onClose,
}: ProductApprovalCenterProps) {
  const { data: pendingOfferings, isLoading } = usePendingProductOfferings(listingId);
  const approveMutation = useApproveProductOffering();
  const [selectedOffering, setSelectedOffering] = useState<any>(null);

  const handleApprove = async (offering: any) => {
    try {
      await approveMutation.mutateAsync({
        offeringId: offering.id,
        approved: true,
      });

      Alert.alert('Goedgekeurd!', `"${offering.productName}" is nu zichtbaar voor iedereen.`);
    } catch (error) {
      Alert.alert('Fout', 'Kon product niet goedkeuren.');
    }
  };

  const handleReject = (offering: any) => {
    Alert.alert('Product afkeuren', `Wil je "${offering.productName}" afkeuren? Geef een reden.`, [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Afkeuren',
        style: 'destructive',
        onPress: () => showRejectionDialog(offering),
      },
    ]);
  };

  const showRejectionDialog = (offering: any) => {
    Alert.prompt(
      'Reden voor afkeuring',
      'Waarom keur je dit product af?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Afkeuren',
          onPress: async (reason) => {
            try {
              await approveMutation.mutateAsync({
                offeringId: offering.id,
                approved: false,
                rejectionReason: reason || 'Afgekeurd door eigenaar',
              });

              Alert.alert('Afgekeurd', `"${offering.productName}" is afgekeurd.`);
            } catch (error) {
              Alert.alert('Fout', 'Kon product niet afkeuren.');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goedkeuringen - {listingName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Community leden hebben producten toegevoegd. Bekijk ze en keur goed of af.
        </Text>

        {pendingOfferings && pendingOfferings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Geen goedkeuringen nodig</Text>
            <Text style={styles.emptyDescription}>Alle inzendingen zijn al behandeld.</Text>
          </View>
        ) : (
          pendingOfferings?.map((offering: any) => (
            <View key={offering.id} style={styles.offeringCard}>
              {/* Foto's */}
              {offering.photos && offering.photos.length > 0 && (
                <View style={styles.photoContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {offering.photos.map((photo: string, index: number) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.offeringContent}>
                <Text style={styles.productName}>{offering.productName}</Text>
                {offering.description && (
                  <Text style={styles.description}>{offering.description}</Text>
                )}

                <View style={styles.details}>
                  {offering.quantity && offering.unit && (
                    <Text style={styles.detail}>
                      • {offering.quantity} {offering.unit}
                    </Text>
                  )}
                  {offering.price && (
                    <Text style={styles.detail}>• €{offering.price.toFixed(2)}</Text>
                  )}
                  {offering.category && <Text style={styles.detail}>• {offering.category}</Text>}
                </View>

                <View style={styles.submitterInfo}>
                  <Ionicons name="person-circle-outline" size={16} color="#6b7280" />
                  <Text style={styles.submitterText}>
                    Ingezonden door{' '}
                    {offering.submittedBy?.name || offering.submittedBy?.email || 'Anoniem'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(offering)}
                  disabled={approveMutation.isPending}>
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.rejectButtonText}>Afkeuren</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(offering)}
                  disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.approveButtonText}>Goedkeuren</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  offeringCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoContainer: {
    marginBottom: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  offeringContent: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  detail: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  submitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitterText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
