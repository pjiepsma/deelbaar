import { useFocusEffect } from '@react-navigation/core';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import Loader from '~/components/Loader';
import ListingCard from '~/components/map/molecules/ListingCard';
import { useAuth } from '~/lib/AuthProvider';
import { useSystem } from '~/lib/powersync/PowerSync';
import { GetFavoriteListings, RemoveFavorite, SelectLatestImages } from '~/lib/powersync/Queries';
import { PictureEntry } from '~/lib/types/types';

interface Listing {
  id: string;
  name: string;
  description: string;
  location: string;
  // Add other listing properties as needed
}

const Favorites = () => {
  const { powersync, connector } = useSystem();
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (user?.id) {
      console.log('Fetching favorites...');

      setLoading(true);
      const result = await getFavoriteListings(user.id);
      if (Array.isArray(result)) {
        setFavorites(result);
      } else {
        setFavorites([]);
      }

      setLoading(false);
      console.log('Favorites fetched: ', favorites);
    }
  };

  // useEffect(() => {
  //   fetchFavorites();
  // }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchFavorites();
    }, [user])
  );

  const getFavoriteListings = async (userId: string) => {
    const result = await powersync.execute(GetFavoriteListings, [userId]);
    const listings = result.rows?._array || [];
    if (listings.length > 0) {
      const listing_ids = listings.map((location) => location.id);
      try {
        const sql = SelectLatestImages(listing_ids);
        const pictures: PictureEntry[] = await powersync.getAll(sql, listing_ids);
        return listings.map((location) => {
          const picture = pictures.find((pic) => pic.listing_id === location.id) || null;
          return {
            ...location,
            favorite: true,
            picture,
          };
        });
      } catch (err) {
        console.error(err);
      }
    }
    return [];
  };

  const removeFavorite = async (userId: string, listingId: string) => {
    const result = await powersync.execute(RemoveFavorite, [userId, listingId]);
    return result;
  };

  const handleRemoveFavorite = async (listingId: string) => {
    if (user?.id) {
      await removeFavorite(user.id, listingId);
      const result = await getFavoriteListings(user.id);
      if (Array.isArray(result)) {
        setFavorites(result);
      } else {
        setFavorites([]);
      }
    }
  };

  return (
    <View style={{ flex: 1, flexGrow: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
        }}
      />
      {loading ? (
        <Loader delay={200} amount={3} visible={loading} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard item={item} onRemoveFavorite={handleRemoveFavorite} category="Books" />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({});

export default Favorites;
