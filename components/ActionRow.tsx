import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Dropdown from '~/components/Dropdown';
import Colors from '~/constants/Colors';
import { OptionItem } from '~/constants/Types';
import { ListingRecord } from '~/lib/powersync/AppSchema';

interface Props {
  onCategoryChanged: (category: string) => void;
  setFilterState: (state: boolean) => void;
  listing: ListingRecord | null;
}

const ActionRow = ({ onCategoryChanged, setFilterState, listing }: Props) => {
  const DATA: OptionItem[] = [
    {
      value: 'Books',
      icon: 'library-outline',
    },
  ];

  const insets = useSafeAreaInsets();
  const safeAreaPadding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const [selected, setSelected] = useState<{ label: string; value: string }>();

  return (
    <View style={[styles.actions, safeAreaPadding]}>
      <View style={styles.container}>
        <Dropdown label="Select Item" data={DATA} onSelect={setSelected} />
        {/*<TouchableOpacity style={styles.filterButton} onPress={() => setFilterState(true)}>*/}
        {/*  <Ionicons name="options-outline" size={24} color={Colors.dark} />*/}
        {/*  <Text>Filter</Text>*/}
        {/*  <View style={styles.round}>*/}
        {/*    <Text style={styles.filterText}>3</Text>*/}
        {/*  </View>*/}
        {/*</TouchableOpacity>*/}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
  },
});

export default ActionRow;
