import { BottomSheetFlatList, BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ListingItem } from '~/components/listing/ListingItem';
import { defaultStyles } from '~/constants/Styles';
import { Store } from '~/lib/powersync/AppSchema';

interface Props {
  listings: Store[];
  refresh: number;
  category: string;
}

const Listings = ({ listings, refresh, category }: Props) => {
  const listRef = useRef<BottomSheetFlatListMethods>(null);

  useEffect(() => {
    if (refresh) {
      scrollListTop();
    }
  }, [refresh]);

  const scrollListTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <View style={defaultStyles.container}>
      <BottomSheetFlatList
        renderItem={ListingItem}
        data={listings}
        ref={listRef}
        ListHeaderComponent={<Text style={styles.info}> Overview </Text>}
      />
    </View>
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
