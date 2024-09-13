import { Ionicons } from '@expo/vector-icons';
import React, { FC, ReactElement, useRef, useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import Colors from '~/constants/Colors';
import { OptionItem } from '~/constants/Types';

interface Props {
  label: string;
  data: OptionItem[];
  onSelect: (item: { label: string; value: string }) => void;
}

const Dropdown: FC<Props> = ({ label, data, onSelect }) => {
  const DropdownButton = useRef<TouchableOpacity>();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<OptionItem>(data[0]);
  const [dropdownTop, setDropdownTop] = useState(0);

  const toggleDropdown = (): void => {
    setVisible(!visible);
  };

  const onLayout = (): void => {
    DropdownButton?.current?.measure((x, y, w, h, px, py) => {
      setDropdownTop(py + h / 3);
    });
  };

  const onItemPress = (item): void => {
    setSelected(item);
    onSelect(item);
    setVisible(false);
  };

  const renderItem = ({ item }): ReactElement<any, any> => (
    <TouchableOpacity style={styles.item} onPress={() => onItemPress(item)}>
      <Ionicons name={item.icon} size={24} color={Colors.dark} />
    </TouchableOpacity>
  );

  const renderDropdown = (): ReactElement<any, any> => {
    return (
      <Modal visible={visible} transparent animationType="none">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.dropdown, { top: dropdownTop }]}>
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <TouchableOpacity
      ref={DropdownButton}
      style={styles.button}
      onPress={toggleDropdown}
      onLayout={onLayout}>
      {renderDropdown()}
      <Ionicons name={selected.icon} size={24} color={Colors.dark} />
      <Ionicons
        name={visible ? 'chevron-up-outline' : 'chevron-down-outline'}
        size={24}
        color={Colors.dark}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    zIndex: 1,

    height: 40,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    flexDirection: 'row',
    width: 100,
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.grey,
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
  },
  icon: {
    marginRight: 10,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#fff',
    left: 10,
    width: 200,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.grey,
  },
  overlay: {
    width: '100%',
    height: '100%',
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  optionItem: {
    gap: 10,
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 30,
    alignItems: 'center',
  },
  buttonB: {
    height: 40,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    flexDirection: 'row',
    width: 70,
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.grey,
  },
});

export default Dropdown;
