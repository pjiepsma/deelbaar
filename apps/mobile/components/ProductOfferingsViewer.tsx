import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

import Colors from '~/constants/Colors';
import {
  useProductOfferings,
  useToggleProductFavorite,
  useReportOutOfStock,
} from '~/lib/hooks/useProductOfferings';
import { useAuth } from '~/lib/providers/AuthProvider';

interface ProductOfferingsViewerProps {
  listingId: string;
  listingName: string;
  isOwner?: boolean; // If true, show management options
  onManage?: () => void; // Callback to open management modal
}

export default function ProductOfferingsViewer({
  listingId,
  listingName,
  isOwner = false,
  onManage,
}: ProductOfferingsViewerProps) {
  const { user } = useAuth();
  const { data: offerings, isLoading } = useProductOfferings(listingId);
  const toggleFavoriteMutation = useToggleProductFavorite();
  const reportOutOfStockMutation = useReportOutOfStock();

  const isLoggedIn = !!user;

  const handleToggleFavorite = async (offeringId: string) => {
    if (!isLoggedIn) {
      Alert.alert('Inloggen vereist', 'Log in om producten te favorieten.');
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync(offeringId);
      // The mutation will invalidate the queries, so UI updates automatically
    } catch (error) {
      Alert.alert('Fout', 'Kon favoriet niet bijwerken.');
    }
  };

  const handleReportOutOfStock = (offeringId: string, productName: string) => {
    if (!isLoggedIn) {
      Alert.alert('Inloggen vereist', 'Log in om producten te rapporteren.');
      return;
    }

    Alert.alert(
      'Product uitverkocht melden',
      `Wil je melden dat "${productName}" uitverkocht is? De eigenaar krijgt een notificatie.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Melden',
          onPress: async () => {
            try {
              await reportOutOfStockMutation.mutateAsync({ offeringId });
              Alert.alert('Gemeld!', 'De eigenaar is geïnformeerd.');
            } catch (error) {
              Alert.alert('Fout', 'Kon melding niet versturen.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Producten laden...</Text>
      </View>
    );
  }

  const availableOfferings =
    offerings?.filter((offering: any) => offering.status === 'available') || [];
  const outOfStockOfferings =
    offerings?.filter((offering: any) => offering.status === 'out_of_stock') || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="basket-outline" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Aanbod bij {listingName}</Text>
        </View>

        {isOwner && onManage && (
          <TouchableOpacity style={styles.manageButton} onPress={onManage}>
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={styles.manageButtonText}>Beheren</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available products */}
        {availableOfferings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🟢 Beschikbaar</Text>
            {availableOfferings.map((offering: any) => (
              <View key={offering.id} style={styles.offeringCard}>
                <View style={styles.offeringContent}>
                  <Text style={styles.offeringTitle}>{offering.productName}</Text>
                  {offering.description && (
                    <Text style={styles.offeringDescription}>{offering.description}</Text>
                  )}

                  <View style={styles.offeringDetails}>
                    {offering.quantity && offering.unit && (
                      <Text style={styles.offeringDetail}>
                        {offering.quantity} {offering.unit}
                      </Text>
                    )}
                    {offering.price && (
                      <Text style={styles.offeringDetail}>
                        €{offering.price.toFixed(2)} per {offering.unit || 'stuk'}
                      </Text>
                    )}
                    {offering.category && (
                      <Text style={styles.offeringDetail}>{offering.category}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.offeringActions}>
                  {isLoggedIn && (
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => handleToggleFavorite(offering.id)}>
                      <Ionicons
                        name="heart-outline" // TODO: Check if favorited
                        size={20}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  )}

                  {!isOwner && isLoggedIn && (
                    <TouchableOpacity
                      style={styles.reportButton}
                      onPress={() => handleReportOutOfStock(offering.id, offering.productName)}>
                      <Ionicons name="flag-outline" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  )}

                  {/* Foto toevoegen voor iedereen */}
                  {isLoggedIn && (
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => {
                        // TODO: Open camera/gallery picker for photo upload
                        Alert.alert('Foto toevoegen', 'Foto upload functie komt binnenkort!');
                      }}>
                      <Ionicons name="camera-outline" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Out of stock products */}
        {outOfStockOfferings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 Uitverkocht</Text>
            {outOfStockOfferings.map((offering: any) => (
              <View key={offering.id} style={[styles.offeringCard, styles.outOfStockCard]}>
                <View style={styles.offeringContent}>
                  <Text style={[styles.offeringTitle, styles.outOfStockText]}>
                    {offering.productName}
                  </Text>
                  {offering.description && (
                    <Text style={[styles.offeringDescription, styles.outOfStockText]}>
                      {offering.description}
                    </Text>
                  )}
                  <Text style={styles.outOfStockNote}>Uitverkocht</Text>
                </View>

                {isLoggedIn && (
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleToggleFavorite(offering.id)}>
                    <Ionicons name="notifications-outline" size={20} color="#6b7280" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {(!offerings || offerings.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Geen producten</Text>
            <Text style={styles.emptyDescription}>
              {isOwner
                ? 'Voeg producten toe om mensen te laten weten wat je aanbiedt.'
                : 'Deze locatie heeft nog geen producten toegevoegd.'}
            </Text>
            {isOwner && onManage && (
              <TouchableOpacity style={styles.addFirstButton} onPress={onManage}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addFirstButtonText}>Eerste product toevoegen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Info for users */}
        {!isOwner && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Favoriet je interesses</Text>
              <Text style={styles.infoText}>
                Voeg producten toe aan je favorieten om notificaties te krijgen wanneer ze weer
                beschikbaar zijn.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  offeringCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  outOfStockCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  offeringContent: {
    flex: 1,
  },
  offeringTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  outOfStockText: {
    color: '#6b7280',
  },
  offeringDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  offeringDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  offeringDetail: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockNote: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  offeringActions: {
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  reportButton: {
    padding: 8,
  },
  photoButton: {
    padding: 8,
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
    marginBottom: 16,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#6b7280',
  },
});
