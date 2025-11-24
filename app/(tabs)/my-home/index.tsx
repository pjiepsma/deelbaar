import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { Suspense, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '~/constants/Colors';
import { useMyListings } from '~/lib/hooks/usePayloadQuery';
import { usePendingApprovalsCount } from '~/lib/hooks/useProductOfferings';
// Lazy load components to avoid circular dependencies
const ManageListingsScreen = React.lazy(() => import('../profile/manage-listings'));
const NotificationsScreen = React.lazy(() => import('../profile/notifications'));

export default function MyHomeTab() {
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'approvals'>('overview');
  const router = useRouter();
  const { data: listings = [], isLoading, refetch, isRefetching } = useMyListings();
  const { data: pendingCount = 0 } = usePendingApprovalsCount();

  const renderOverviewTab = () => {
    const renderEmpty = () => (
      <View style={styles.emptyState}>
        <Ionicons name="home-outline" size={48} color="#9AA4B5" />
        <Text style={styles.emptyText}>Nog geen kasten</Text>
        <Text style={styles.emptySubtext}>
          Voeg je eerste kast toe om hem hier terug te zien en te beheren.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveTab('manage')}>
          <Text style={styles.primaryButtonText}>Voeg een kast toe</Text>
        </TouchableOpacity>
      </View>
    );

    const renderItem = ({ item }: any) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/(modals)/listing/[id]',
            params: { id: item.id },
          })
        }>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={18} color="#9AA4B5" />
        </View>
        {item.location?.address ? (
          <Text style={styles.cardSubtitle}>{item.location.address}</Text>
        ) : (
          <Text style={styles.cardSubtitleMuted}>Adres nog niet ingevuld</Text>
        )}
        {item.category ? <Text style={styles.cardMeta}>Type: {item.category}</Text> : null}
      </TouchableOpacity>
    );

    if (isLoading && listings.length === 0) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <FlatList
        data={listings}
        refreshing={isRefetching}
        onRefresh={refetch}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderManageTab = () => (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <ManageListingsScreen />
    </Suspense>
  );

  const renderApprovalsTab = () => (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <NotificationsScreen />
    </Suspense>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Tab Navigator */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}>
            <Ionicons name="home" size={16} color={activeTab === 'overview' ? '#fff' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overzicht
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
            onPress={() => setActiveTab('manage')}>
            <Ionicons name="create" size={16} color={activeTab === 'manage' ? '#fff' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>
              Beheren
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'approvals' && styles.activeTab]}
            onPress={() => setActiveTab('approvals')}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={activeTab === 'approvals' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === 'approvals' && styles.activeTabText]}>
              Goedkeuringen
            </Text>
            {(pendingCount || 0) > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'manage' && renderManageTab()}
          {activeTab === 'approvals' && renderApprovalsTab()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2933',
    marginTop: 16,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2933',
  },
  cardSubtitle: {
    marginTop: 8,
    color: '#4B6A88',
  },
  cardSubtitleMuted: {
    marginTop: 8,
    color: '#9AA4B5',
  },
  cardMeta: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
});
