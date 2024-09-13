import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

import Listings from '~/components/listing/Listings';
import Colors from '~/constants/Colors';

interface Props {
  listings: any;
  category: string;
  animatedPosition: SharedValue<number>;
}

const CustomBackground: React.FC<BottomSheetBackgroundProps> = ({ style }) => {
  return <View pointerEvents="none" style={[style, { backgroundColor: Colors.light }]} />;
};

const ListingsBottomSheet = ({ listings, category, animatedPosition }: Props) => {
  const snapPoints = useMemo(() => ['8%', '100%'], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [refresh, setRefresh] = useState<number>(0);

  const onShowMap = () => {
    bottomSheetRef.current?.collapse();
    setRefresh(refresh + 1);
  };

  return (
    <BottomSheet
      backgroundComponent={CustomBackground}
      animatedIndex={animatedPosition}
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      handleIndicatorStyle={{ backgroundColor: Colors.grey }}
      style={styles.sheetContainer}>
      <View style={styles.contentContainer}>
        <Listings listings={listings} refresh={refresh} category={category} />
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
  contentContainer: {
    flex: 1,
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
