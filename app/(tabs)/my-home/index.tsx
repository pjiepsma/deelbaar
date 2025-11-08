import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '~/constants/Colors';
import { useMyListings } from '~/lib/hooks/usePayloadQuery';

export default function MyHomeTab() {
  const router = useRouter();
  const {
    data: listings = [],
    isLoading,
    refetch,
    isRefetching,
  } = useMyListings();

  const handleManage = () => {
    router.push('(tabs)/profile/manage-listings');
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="home-outline" size={48} color="#9AA4B5" />
      <Text style={styles.emptyText}>Nog geen listings</Text>
      <Text style={styles.emptySubtext}>
        Voeg je eerste locatie toe via je account om hem hier terug te zien.
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={handleManage}>
        <Text style={styles.primaryButtonText}>Voeg een listing toe</Text>
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
    <View style={styles.container}>
      <FlatList
        data={listings}
        refreshing={isRefetching}
        onRefresh={refetch}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
      {listings.length > 0 && (
        <TouchableOpacity style={styles.manageButton} onPress={handleManage}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.manageButtonText}>Beheer mijn listings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
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
  manageButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

