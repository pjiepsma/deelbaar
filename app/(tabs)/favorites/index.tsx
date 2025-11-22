import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '~/constants/Colors';
import { useFavorites } from '~/lib/hooks/usePayloadQuery';
import { useToggleFavorite } from '~/lib/hooks/usePayloadQuery';

export default function FavoritesTab() {
  const { data: favorites = [], isLoading, isError } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Favorieten ophalen mislukt</Text>
          <Text style={styles.errorText}>Controleer je verbinding met de Payload API.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!favorites.length) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Nog geen favorieten</Text>
          <Text style={styles.emptySubtitle}>Markeer een listing als favoriet vanuit de zoekpagina.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={favorites}
        keyExtractor={(item) => item.id ?? `${item.listing}-${item.user}`}
        renderItem={({ item }) => {
        const listing = item.listing?.id ? item.listing : item.listingData;
        if (!listing) {
          return null;
        }

        const handleToggle = () =>
          toggleFavorite.mutate({
            listingId: listing.id,
            isFavorite: true,
          });

        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{listing.title ?? 'Onbekende listing'}</Text>
              <TouchableOpacity onPress={handleToggle} style={styles.favoriteButton}>
                <Ionicons name="heart" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
            {listing.address && <Text style={styles.cardAddress}>{listing.address}</Text>}
            {listing.description && <Text style={styles.cardDescription}>{listing.description}</Text>}
            <View style={styles.cardFooter}>
              {listing.price && (
                <Text style={styles.cardPrice}>€ {Number(listing.price).toLocaleString('nl-NL')}</Text>
              )}
              <Text style={styles.cardMeta}>Listing ID: {listing.id}</Text>
            </View>
          </View>
        );
      }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardAddress: {
    fontSize: 14,
    color: '#4b5563',
  },
  cardDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  favoriteButton: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    padding: 32,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#4b5563',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#991b1b',
  },
  errorText: {
    color: '#ef4444',
  },
});

