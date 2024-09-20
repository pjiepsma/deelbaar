import { BottomSheetFlatList, BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { ListRenderItem, StyleSheet, Text } from 'react-native';

import { ListingItem } from '~/components/listing/ListingItem';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';

interface Props {
  listings: ListingRecord[];
  refresh: number;
  category: string;
}

const Listings = ({ listings, refresh, category }: Props) => {
  const listRef = useRef<BottomSheetFlatListMethods>(null);
  const { powersync } = useSystem();

  useEffect(() => {
    if (refresh) {
      scrollListTop();
    }
  }, [refresh]);

  const scrollListTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem: ListRenderItem<ListingRecord> = ({ item }) => <ListingItem item={item} />;

  return (
    <BottomSheetFlatList
      renderItem={renderItem}
      data={listings}
      keyExtractor={(item) => item.id}
      ref={listRef}
      ListHeaderComponent={<Text style={styles.info}> Overview </Text>}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  info: {
    textAlign: 'center',
    fontFamily: 'mon-sb',
    fontSize: 16,
  },
});

export default Listings;
