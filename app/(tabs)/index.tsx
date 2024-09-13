import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import FilterModal from '~/app/(modals)/filter';
import ActionRow from '~/components/ActionRow';
import Header from '~/components/Header';
import ListingsBottomSheet from '~/components/listing/ListingsBottomSheet';
import ListingsMap from '~/components/listing/ListingsMap';
import { Store } from '~/lib/powersync/AppSchema';

const Index = () => {
  const [category, setCategory] = useState('Books');
  const [modalState, setModalState] = useState(false);
  const animatedPosition = useSharedValue(0);
  const [listings, setListings] = useState<Store[]>([]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeAreaView style={styles.safeArea}>
              <Header onNotificationsPress={() => {}} onProfilePress={() => {}} />
            </SafeAreaView>
          ),
        }}
      />
      <ActionRow
        onCategoryChanged={setCategory}
        setModalState={setModalState}
        animatedPosition={animatedPosition}
      />
      <ListingsMap category={category} setListings={setListings} listings={listings} />
      <ListingsBottomSheet
        listings={listings}
        category={category}
        animatedPosition={animatedPosition}
      />
      <FilterModal state={modalState} setState={setModalState} />
    </View>
  );
};
export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    backgroundColor: '#fff',
    // paddingTop: 10,
    // paddingBottom: 10,
  },
});
