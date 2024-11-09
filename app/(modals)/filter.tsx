import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';

import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';

interface FilterProps {
  state: boolean;
  setState: (state: boolean) => void;
}

const FilterModal = ({ state, setState }: FilterProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['95%'], []);

  const handleCloseModalPress = useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  useEffect(() => {
    if (state) {
      bottomSheetModalRef.current?.present();
    }
  }, [state]);

  const data = useMemo(
    () =>
      Array(50)
        .fill(0)
        .map((_, index) => `index-${index}`),
    []
  );

  const renderItem = (item: any) => (
    <View key={item} style={styles.itemContainer}>
      <Text>{item}</Text>
    </View>
  );

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />,
    []
  );

  // renders
  return (
    <View style={styles.container}>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={() => setState(false)}>
        <View style={defaultStyles.row}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => handleCloseModalPress()}>
            <Ionicons name="close-outline" size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text>Filters</Text>
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
          {data.map(renderItem)}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  contentContainer: {
    backgroundColor: 'white',
  },
  itemContainer: {
    padding: 6,
    margin: 6,
    backgroundColor: '#eee',
  },
  closeBtn: {
    padding: 14,
  },
});

export default FilterModal;
