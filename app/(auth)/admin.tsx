import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import geo from '~/assets/data/minibieb-gelderland-points.json';
import Gelderland from '~/assets/data/minibieb-gelderland.json';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/AuthProvider';
import { useSystem } from '~/lib/powersync/PowerSync';
import { supabase } from '~/lib/powersync/SupabaseConnector';
import { InsertListing } from '~/lib/powersync/Queries';

const BATCH_SIZE = 10; // Set your batch size
const RETRY_LIMIT = 3; // Maximum number of retries
const RETRY_DELAY = 1000; // 1 second delay between retries

interface TransformedListing {
  name: string | null;
  address: string | null;
  description: string | null;
  city: string;
}

export default function Admin() {
  const router = useRouter();
  const { powersync } = useSystem();
  const { user } = useAuth();
  const [listings, setListings] = useState<TransformedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBatch, setCurrentBatch] = useState(10);
  const [message, setMessage] = useState('');
  const [load, setLoad] = useState(false); // Loading state

  const getAllLocations = async (): Promise<{ latitude: number; longitude: number }[]> => {
    const { data, error } = await supabase.rpc('get_all_locations');
    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
    return data;
  };

  // Function to convert geometry to location
  const convertGeometryToLocation = async (address: string, city: string) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    const geocoded = await Location.geocodeAsync(`${address} ${city}`);
    if (geocoded.length > 0) {
      const { latitude, longitude } = geocoded[0];
      return { latitude, longitude };
    } else {
      console.log('No geocoding results found.');
      return null;
    }
  };

  const convertCoordinatesToAddress = async (coords) => {
    const results = await Promise.all(
      coords.map(async ({ latitude, longitude }) => {
        const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (result) {
          return {
            address: result.street || null,
            city: result.city || null,
          };
        }
        return null;
      })
    );

    return results.filter((item) => item !== null);
  };

  // Fetch and transform geometries to listings
  const fetchListings = async () => {
    const geometries = [
      ...new Map(Gelderland.geometries.map((item) => [item.properties.Adres, item])).values(),
    ];

    const transformedListings: TransformedListing[] = geometries.map((item) => {
      const { Name, Adres, Bijzonderheid, Plaatsnaam } = item.properties;
      const match = Plaatsnaam?.match(/^\d{4} [A-Z]{2} (.+)$/);
      const city = match ? match[1] : '';

      return {
        name: Name || null,
        address: Adres || null,
        description: Bijzonderheid || null,
        city,
      };
    });
    setListings(transformedListings); // Set the state with transformed listings
  };
  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      await fetchListings();
      setLoading(false);
    };

    loadListings();
  }, []);

  const createListing = async (
    name: string,
    address: string,
    description: string | null,
    city: string,
    category: string
  ) => {
    if (user) {
      const coordinates = await convertGeometryToLocation(address, city); // Convert geometry to location
      if (!coordinates) {
        console.error('Could not get coordinates from address and city');
        return;
      }

      const point = `POINT(${coordinates.longitude} ${coordinates.latitude})`;

      const res = await powersync.execute(InsertListing, [
        name,
        description,
        point,
        user.id,
        category,
      ]);

      const resultRecord = res.rows?.item(0);
      if (!resultRecord) {
        throw new Error('Could not create list');
      }
    } else {
      router.replace('/(modals)/login');
    }
  };

  // Delay function to wait for a specified time
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Function to insert a batch with retry logic
  const insertBatchWithRetries = async (listings, batchNumber) => {
    let attempt = 0;
    let success = false;
    let error;

    while (attempt < RETRY_LIMIT && !success) {
      try {
        console.log(`Inserting batch ${batchNumber + 1}, attempt ${attempt + 1}`);
        const { data, error: insertError } = await supabase.from('listings').insert(listings);

        if (insertError) {
          throw insertError; // Throw to catch and retry
        }

        console.log(`Inserted batch ${batchNumber + 1}:`, data);
        success = true;
        setMessage(`Inserted batch ${batchNumber + 1}`);
      } catch (err) {
        error = err;
        console.error(
          `Error inserting batch ${batchNumber + 1} on attempt ${attempt + 1}:`,
          err.message
        );
        setMessage(`Error inserting batch ${batchNumber + 1}: ${err.message}`);
        attempt += 1;
        if (attempt < RETRY_LIMIT) {
          await delay(RETRY_DELAY); // Wait before retrying
        }
      }
    }

    if (!success) {
      console.error(
        `Failed to insert batch ${batchNumber + 1} after ${RETRY_LIMIT} attempts`,
        error.message
      );
      setMessage(
        `Failed to insert batch ${batchNumber + 1} after ${RETRY_LIMIT} attempts: ${error.message}`
      );
    }

    return success;
  };

  // Function to insert batches starting from a specific batch
  const insertBatches = async (startBatch = 0, geos) => {
    setLoading(true); // Start loading
    setMessage(`Starting batch insertion from batch ${startBatch + 1}...`);

    const totalBatches = Math.ceil(geos.length / BATCH_SIZE);

    for (let i = startBatch; i < totalBatches; i++) {
      const batch = geos.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

      // Create the listings array with UUIDs generated client-side
      const listings = batch.map((geo) => ({
        id: uuidv4(), // Generate UUIDs using the uuid library
        name: geo.name, // Escape single quotes in names
        description: geo.description,
        location: geo.location,
        owner_id: geo.owner_id,
        created_at: new Date().toISOString(), // or datetime() equivalent
        category: geo.category,
      }));

      const success = await insertBatchWithRetries(listings, i);

      if (!success) {
        console.error(`Stopping insertion process due to repeated failure in batch ${i + 1}`);
        break; // Stop if a batch fails after retries
      }
    }

    setMessage('Batch insertion process completed.');
    setLoading(false); // Stop loading after all batches are inserted
  };

  const ListItem: React.FC<{
    properties: TransformedListing;
    onPress: (event: GestureResponderEvent) => void;
    index: number;
  }> = ({ properties, onPress, index }) => (
    <View style={styles.item} key={index}>
      <Text>{`${properties.address} ${properties.city}`}</Text>
      <TouchableOpacity
        onPress={onPress}
        style={styles.addButton}
        accessible
        accessibilityLabel={`Add ${properties.name}`}>
        <Text>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <ScrollView style={styles.container}>
          {/*<TouchableOpacity onPress={() => createAllListings(geo)} style={styles.addButton}>*/}
          {/*  <Text>Add all</Text>*/}
          {/*</TouchableOpacity>*/}
          <View style={{ padding: 20 }}>
            <Text>{message}</Text>
            <Button
              title="Insert Next Batch"
              onPress={() => insertBatches(0, geo)}
              disabled={load} // Disable button when loading
            />
            {load && <ActivityIndicator size="small" color="#0000ff" />}
          </View>
          {/*{listings.map((item, index) => (*/}
          {/*  <ListItem*/}
          {/*    key={index}*/}
          {/*    properties={item}*/}
          {/*    onPress={*/}
          {/*      () => createListing(item.name, item.address, item.description, item.city, 'Books') // Pass raw geometry*/}
          {/*    }*/}
          {/*    index={index}*/}
          {/*  />*/}
          {/*))}*/}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: Colors.grey,
    justifyContent: 'space-between',
  },
  addButton: {
    width: 30,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
});
