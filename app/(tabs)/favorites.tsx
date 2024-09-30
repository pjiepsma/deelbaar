import { useQuery, useStatus } from '@powersync/react-native';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';

import { ListItemWidget } from '~/components/widget/ListItemWidget';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import {
  DeleteListing,
  DeleteListingPictures,
  InsertListing,
  SelectListings,
} from '~/lib/powersync/Queries';

const description = (total: number, completed: number = 0) => {
  return `${total - completed} pending, ${completed} completed`;
};

const ListsViewWidget: React.FC = () => {
  const { powersync, connector } = useSystem();
  const { user, signIn } = useAuth();
  const status = useStatus();
  const { data: ListingRecords } = useQuery<ListingRecord>(SelectListings);
  const router = useRouter();

  const createListing = async (name: string) => {
    if (user) {
      const location = await Location.getCurrentPositionAsync({});
      const point = `POINT(${location.coords.longitude} ${location.coords.latitude})`;
      const res = await powersync.execute(InsertListing, [name, 'todo', point, user.id]);
      console.log(res);
      const resultRecord = res.rows?.item(0);
      if (!resultRecord) {
        throw new Error('Could not create list');
      }
    } else {
      router.replace('/(modals)/login');
    }
  };

  const deleteList = async (id: string) => {
    await powersync.writeTransaction(async (tx) => {
      // Delete associated todos
      await tx.execute(DeleteListingPictures, [id]);
      // Delete list record
      await tx.execute(DeleteListing, [id]);
    });
  };

  return (
    <View style={{ flex: 1, flexGrow: 1 }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      {/*<TouchableOpacity*/}
      {/*  style={styles.button}*/}
      {/*  onPress={async () => {*/}
      {/*    const name = await new Promise<string | null>((resolve) => {*/}
      {/*      prompt(*/}
      {/*        'Add a new list',*/}
      {/*        '',*/}
      {/*        (inputName) => {*/}
      {/*          resolve(inputName);*/}
      {/*        },*/}
      {/*        { placeholder: 'List name', style: 'shimo' }*/}
      {/*      );*/}
      {/*    });*/}

      {/*    if (name) {*/}
      {/*      try {*/}
      {/*        await createListing(name);*/}
      {/*        // Optionally, provide feedback to the user (e.g., Toast notification)*/}
      {/*      } catch (error) {*/}
      {/*        console.error('Error creating listing:', error);*/}
      {/*        // Handle error (e.g., show an alert to the user)*/}
      {/*      }*/}
      {/*    }*/}
      {/*  }}>*/}
      {/*  <Icon name="add" size={24} color="white" />*/}
      {/*</TouchableOpacity>*/}
      <TouchableOpacity style={styles.button} onPress={() => router.navigate('(auth)/admin')}>
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>
      <ScrollView key="lists" style={{ maxHeight: '90%' }}>
        {!status.hasSynced ? (
          <Text>Busy with sync...</Text>
        ) : (
          ListingRecords.map((r) => (
            <ListItemWidget
              key={r.id}
              title={r.name}
              description={description(0, 0)}
              onDelete={() => deleteList(r.id)}
              onPress={() => {
                router.push({
                  pathname: '/(modals)/picture/[id]',
                  params: { id: r.id },
                });
              }}
            />
          ))
        )}
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'blue', // Adjust color as needed
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Android shadow effect
  },
  buttonText: {
    color: 'white',
    marginTop: 8, // Space between icon and text
  },
});

export default ListsViewWidget;
