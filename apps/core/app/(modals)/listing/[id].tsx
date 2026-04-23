import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Spinner } from 'heroui-native/spinner';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useListing } from '~/lib/hooks/data/useListingQueries';
import type { ListingRecord } from '~/lib/types/models';

function bodyText(listing: ListingRecord) {
  const parts = [
    listing.description,
    listing.location?.address,
    listing.category ? `Categorie: ${listing.category}` : null,
  ].filter(Boolean);
  return parts.join('\n\n');
}

export default function ListingDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listingId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
  const { data: listing, isLoading, isError, error } = useListing(listingId);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-4 pb-3">
        <Text className="text-lg font-semibold text-foreground">Listing</Text>
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          Sluiten
        </Button>
      </View>

      {isLoading && (
        <View className="flex-1 items-center justify-center py-16">
          <Spinner size="lg" />
        </View>
      )}

      {isError && (
        <View className="flex-1 px-4">
          <Card className="p-4">
            <Card.Body>
              <Text className="text-base text-red-600">
                {error instanceof Error ? error.message : 'Kon listing niet laden.'}
              </Text>
            </Card.Body>
          </Card>
        </View>
      )}

      {!isLoading && !isError && listing && (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <Card>
            <Card.Header>
              <Card.Title>{listing.name}</Card.Title>
              {listing.publishStatus ? (
                <Card.Description>{listing.publishStatus}</Card.Description>
              ) : null}
            </Card.Header>
            <Card.Body>
              <Text className="text-base leading-6 text-foreground">{bodyText(listing)}</Text>
            </Card.Body>
          </Card>
        </ScrollView>
      )}

      {!isLoading && !isError && !listing && listingId && (
        <View className="flex-1 px-4">
          <Text className="text-base text-muted">Geen gegevens voor deze listing.</Text>
        </View>
      )}
    </View>
  );
}
