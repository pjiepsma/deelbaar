import { useQuery, useStatus } from '@powersync/react-native';
import * as Location from 'expo-location';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { FAB, Text } from 'react-native-elements';
import prompt from 'react-native-prompt-android';

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

  const createListing = async (name: string) => {
    if (user) {
      const location = await Location.getCurrentPositionAsync({});
      const point = `POINT(${location.coords.longitude} ${location.coords.latitude})`;
      const res = await powersync.execute(InsertListing, [name, 'todo', point, user.id]);

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
      <FAB
        style={{ zIndex: 99, bottom: 0 }}
        icon={{ name: 'add', color: 'white' }}
        size="small"
        placement="right"
        onPress={() => {
          prompt(
            'Add a new list',
            '',
            async (name) => {
              if (!name) {
                return;
              }
              await createListing(name);
            },
            { placeholder: 'List name', style: 'shimo' }
          );
        }}
      />
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

export default ListsViewWidget;
