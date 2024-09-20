import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Dropdown from '~/components/Dropdown';
import Colors from '~/constants/Colors';
import { OptionItem } from '~/constants/Types';
import { ListingRecord } from '~/lib/powersync/AppSchema';

interface Props {
  onCategoryChanged: (category: string) => void;
  setModalState: (state: boolean) => void;
  animatedPosition: any;
  listing: ListingRecord | null;
}

const ActionRow = ({ onCategoryChanged, setModalState, animatedPosition, listing }: Props) => {
  const fadeInOpacity = useSharedValue(1);
  const [isVisible, setVisible] = useState<boolean>(true);

  const fadeIn = () => {
    setVisible(true);
    fadeInOpacity.value = withTiming(1, {
      duration: 150,
      easing: Easing.linear,
    });
  };
  const fadeOut = () => {
    fadeInOpacity.value = withTiming(
      0,
      {
        duration: 150,
        easing: Easing.linear,
      },
      (complete) => {
        if (complete) {
          runOnJS(setVisible)(false);
        }
      }
    );
  };

  useEffect(() => {
    if (listing) {
      fadeOut();
    } else {
      fadeIn();
    }
  }, [listing]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeInOpacity.value, // Use the value directly
    };
  });

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
    backgroundColor: interpolateColor(animatedPosition.value, [0.9, 1], ['transparent', 'white']),
  }));

  const [selected, setSelected] = useState<{ label: string; value: string }>();
  const onDataChanged = (item: OptionItem) => {};
  return (
    <Animated.View style={[styles.actions, backdropStyle, animatedStyle]}>
      {isVisible && (
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
      )}
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
