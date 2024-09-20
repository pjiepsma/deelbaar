import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';
import { ListingRecord } from '~/lib/powersync/AppSchema';

interface Props {
  listing: ListingRecord | null;
  setListing: (state: ListingRecord | null) => void;
}

const CustomBackground: React.FC<BottomSheetBackgroundProps> = ({ style }) => {
  return <View pointerEvents="none" style={[style, { backgroundColor: Colors.light }]} />;
};

const ListingBottomSheet = ({ listing, setListing }: Props) => {
  const snapPoints = useMemo(() => ['10%', '50%', '100%'], []);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleClosePress = () => {
    setListing(null);
    bottomSheetRef.current?.close();
  };

  const handleSheetChanges = (index: number) => {
    if (index === 0) {
      handleClosePress();
    }
  };

  useEffect(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToPosition('100%');
    }
  }, [listing]);

  return (
    <BottomSheet
      backgroundComponent={CustomBackground}
      ref={bottomSheetRef}
      index={0}
      onChange={handleSheetChanges}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      handleIndicatorStyle={{ backgroundColor: Colors.grey }}
      style={styles.sheetContainer}>
      <View style={styles.contentContainer}>
        <View style={defaultStyles.row}>
          <Text>{listing?.name}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => handleClosePress()}>
            <Ionicons name="close-outline" size={24} color={Colors.dark} />
          </TouchableOpacity>
        </View>
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
  closeBtn: {
    padding: 14,
  },
});

export default ListingBottomSheet;
