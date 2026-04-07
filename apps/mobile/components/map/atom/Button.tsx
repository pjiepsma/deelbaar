// atoms/Button.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import Colors from '~/constants/Colors';

interface ButtonProps {
  onPress: () => void;
}

const LocateButton: React.FC<ButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.locateBtn} onPress={onPress}>
    <Ionicons name="navigate" size={24} color={Colors.dark} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  locateBtn: {
    position: 'absolute',
    right: 20,
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

export default LocateButton;
