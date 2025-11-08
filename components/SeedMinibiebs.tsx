import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { payloadClient } from '~/lib/api/PayloadClient';
import { useAuth } from '~/lib/providers/AuthProvider';
import apeldoornListings from '../scripts/seedApeldoornMinibiebs.json';

/**
 * Component to seed Minibieb listings in Apeldoorn
 * Add this to your profile/admin page to seed data
 */
export default function SeedMinibiebs() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { user } = useAuth();

  const seedListings = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to seed data');
      return;
    }

    setLoading(true);
    setResults([]);
    const newResults: string[] = [];

    for (const listing of apeldoornListings) {
      try {
        const listingData = {
          ...listing,
          owner: user.id, // Set current user as owner
        };

        const { data, error } = await payloadClient.create('listings', listingData);

        if (error) {
          newResults.push(`❌ ${listing.name}: ${error.message}`);
        } else {
          newResults.push(`✅ ${listing.name}`);
        }
      } catch (error: any) {
        newResults.push(`❌ ${listing.name}: ${error.message}`);
      }
    }

    setResults(newResults);
    setLoading(false);
    Alert.alert('Done!', `Seeded ${newResults.filter(r => r.startsWith('✅')).length} listings`);
  };

  return (
    <View className="p-4 bg-white rounded-lg">
      <Text className="text-xl font-bold mb-2">Seed Apeldoorn Minibiebs</Text>
      <Text className="text-gray-600 mb-4">
        This will create {apeldoornListings.length} Minibieb listings in Apeldoorn, Netherlands
      </Text>

      <TouchableOpacity
        onPress={seedListings}
        disabled={loading || !user}
        className={`p-4 rounded-lg ${loading || !user ? 'bg-gray-300' : 'bg-primary'}`}>
        {loading ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator color="white" />
            <Text className="text-white ml-2">Seeding...</Text>
          </View>
        ) : (
          <Text className="text-white text-center font-semibold">
            Seed {apeldoornListings.length} Minibiebs
          </Text>
        )}
      </TouchableOpacity>

      {!user && (
        <Text className="text-red-500 mt-2 text-sm">
          ⚠️ You must be logged in to seed data
        </Text>
      )}

      {results.length > 0 && (
        <ScrollView className="mt-4 max-h-64 bg-gray-50 p-2 rounded">
          {results.map((result, index) => (
            <Text key={index} className="text-xs mb-1">
              {result}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}


