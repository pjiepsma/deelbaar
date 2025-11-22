import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import {
  useUserPendingApprovals,
  useApproveProductOffering,
} from '../../../lib/hooks/useProductOfferings';
import { useAuth } from '../../../lib/providers/AuthProvider';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { data: pendingApprovals, isLoading, refetch } = useUserPendingApprovals();
  const approveMutation = useApproveProductOffering();

  const handleApprove = (offeringId: string, approved: boolean, rejectionReason?: string) => {
    Alert.alert(
      approved ? 'Goedkeuren' : 'Afwijzen',
      approved
        ? 'Weet je zeker dat je deze foto wilt goedkeuren?'
        : 'Waarom wil je deze foto afwijzen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: approved ? 'Goedkeuren' : 'Afwijzen',
          style: approved ? 'default' : 'destructive',
          onPress: () => {
            approveMutation.mutate(
              { offeringId, approved, rejectionReason },
              {
                onSuccess: () => {
                  Alert.alert('Succes', approved ? 'Foto goedgekeurd!' : 'Foto afgewezen.');
                  refetch();
                },
                onError: () => {
                  Alert.alert('Fout', 'Er ging iets mis. Probeer het opnieuw.');
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleReject = (offeringId: string) => {
    Alert.prompt(
      'Afwijzen',
      'Waarom wil je deze foto afwijzen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Afwijzen',
          style: 'destructive',
          onPress: (reason) => {
            if (reason) {
              handleApprove(offeringId, false, reason);
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
      <View style={styles.center}>
        <Text>Bezig met laden...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={24} color="#3B82F6" />
        <Text style={styles.title}>Goedkeuringen</Text>
      </View>

      {!pendingApprovals || pendingApprovals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text style={styles.emptyTitle}>Alles up-to-date!</Text>
          <Text style={styles.emptyText}>Er zijn geen foto's die wachten op goedkeuring.</Text>
        </View>
      ) : (
        <View style={styles.approvalsList}>
          {pendingApprovals.map((approval: any) => (
            <View key={approval.id} style={styles.approvalCard}>
              <View style={styles.approvalHeader}>
                <Text style={styles.listingName}>{approval.listingName}</Text>
                <Text style={styles.productName}>{approval.name}</Text>
              </View>

              <View style={styles.photoContainer}>
                {approval.photos && approval.photos.length > 0 ? (
                  <View style={styles.photoGrid}>
                    {approval.photos.map((photo: string, index: number) => (
                      <View key={index} style={styles.photoWrapper}>
                        {/* Hier zou je normaal een Image component gebruiken */}
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="image" size={24} color="#9CA3AF" />
                          <Text style={styles.photoText}>Foto {index + 1}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noPhotos}>Geen foto's toegevoegd</Text>
                )}
              </View>

              <View style={styles.approvalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(approval.id)}
                  disabled={approveMutation.isPending}>
                  <Ionicons name="close" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Afwijzen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(approval.id, true)}
                  disabled={approveMutation.isPending}>
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Goedkeuren</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  approvalsList: {
    padding: 20,
  },
  approvalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  approvalHeader: {
    marginBottom: 12,
  },
  listingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  productName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoWrapper: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 8,
  },
  photoPlaceholder: {
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  noPhotos: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  approvalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
