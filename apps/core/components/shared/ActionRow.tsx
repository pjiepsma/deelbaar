import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Dropdown from '~/components/shared/Dropdown';
import { OptionItem } from '~/constants/Types';
import { ListingRecord } from '~/lib/types/models';

interface Props {
  onCategoryChanged: (category: string) => void;
  setFilterState: (state: boolean) => void;
  listing: ListingRecord | null;
}

const ActionRow = (_props: Props) => {
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

  const [_selected, setSelected] = useState<OptionItem | undefined>();

  return (
    <View style={[styles.actions, safeAreaPadding]}>
      <View style={styles.container}>
        <Dropdown label="Select Item" data={DATA} onSelect={setSelected} />
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
});

export default ActionRow;
