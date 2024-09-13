import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import Colors from '~/constants/Colors';
import { OptionItem } from '~/constants/Types';
import Dropdown from '~/components/Dropdown';

interface Props {
  onCategoryChanged: (category: string) => void;
  setModalState: (state: boolean) => void;
  animatedPosition: any;
}

const ActionRow = ({ onCategoryChanged, setModalState, animatedPosition }: Props) => {
  const DATA: OptionItem[] = [
    {
      value: 'Books',
      icon: 'library-outline',
    },
    {
      value: 'Water',
      icon: 'water-outline',
    },
  ];

  const backdropStyle = useAnimatedStyle(() => ({
    // move this from index to here, included animationPosition
    backgroundColor: interpolateColor(animatedPosition.value, [0.9, 1], ['transparent', 'white']),
  }));
  const [selected, setSelected] = useState(undefined);
  const onDataChanged = (item: OptionItem) => {
    // setCategory(category);
  };
  return (
    <Animated.View style={[styles.actions, backdropStyle]}>
      <View style={styles.container}>
        <Dropdown label="Select Item" data={DATA} onSelect={setSelected} />

        <TouchableOpacity style={styles.filterButton} onPress={() => setModalState(true)}>
          <Ionicons name="options-outline" size={24} color={Colors.dark} />
          <Text>Filter</Text>
          <View style={styles.round}>
            <Text style={styles.filterText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 10,
  },
  filter: {
    display: 'flex',
  },
  actions: {
    width: '100%',
    position: 'absolute',
    zIndex: 3,
  },
  round: {
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.grey,
    height: 16,
    width: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterText: {
    fontSize: 10,
    color: 'white',
  },
  filterButton: {
    height: 40,
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
    width: 100,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey,
    borderRadius: 8,
  },
});
export default ActionRow;
