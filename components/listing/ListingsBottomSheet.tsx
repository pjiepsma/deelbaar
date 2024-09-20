import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetBackgroundProps,
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
} from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ListRenderItem, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

import { ListingItem } from '~/components/listing/ListingItem';
import Colors from '~/constants/Colors';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';

interface Props {
  listings: ListingRecord[];
  category: string;
  animatedPosition: SharedValue<number>;
  setListing: (state: ListingRecord | null) => void;
}

const CustomBackground: React.FC<BottomSheetBackgroundProps> = ({ style }) => {
  return <View pointerEvents="none" style={[style, { backgroundColor: Colors.light }]} />;
};

const ListingsBottomSheet = ({ listings, category, animatedPosition, setListing }: Props) => {
  const snapPoints = useMemo(() => ['10%', '50%', '100%'], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [refresh, setRefresh] = useState<number>(0);

  const onShowMap = () => {
    bottomSheetRef.current?.collapse();
    setRefresh(refresh + 1);
  };

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

  const renderItem: ListRenderItem<ListingRecord> = ({ item }) => (
    <ListingItem listing={item} setListing={setListing} />
  );

  return (
    <BottomSheet
      backgroundComponent={CustomBackground}
      animatedIndex={animatedPosition}
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      handleIndicatorStyle={{ backgroundColor: Colors.grey }}
      style={styles.sheetContainer}>
      <View style={styles.contentContainer}>
        <BottomSheetFlatList
          renderItem={renderItem}
          data={listings}
          keyExtractor={(item) => item.id}
          ref={listRef}
          ListHeaderComponent={<Text style={styles.info}> Overview </Text>}
        />
      </View>
      <View style={styles.absoluteView}>
        <TouchableOpacity onPress={onShowMap} style={styles.btn}>
          <Text style={{ fontFamily: 'mon-sb', color: '#fff' }}>Map</Text>
          <Ionicons name="map" size={20} style={{ marginLeft: 10 }} color="#fff" />
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  info: {
    textAlign: 'center',
    fontFamily: 'mon-sb',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 14,
  },
  absoluteView: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  btn: {
    backgroundColor: Colors.dark,
    padding: 14,
    height: 50,
    borderRadius: 30,
    flexDirection: 'row',
    marginHorizontal: 'auto',
    alignItems: 'center',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {
      width: 1,
      height: 1,
    },
  },
});

export default ListingsBottomSheet;
