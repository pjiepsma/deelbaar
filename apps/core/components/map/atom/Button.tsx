// atoms/Button.tsx
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import React from 'react';
import { StyleSheet } from 'react-native';

import { useAppColors } from '~/lib/theme';

interface ButtonProps {
  onPress: () => void;
}

const LocateButton: React.FC<ButtonProps> = ({ onPress }) => {
  const colors = useAppColors();
  return (
    <Button
      isIconOnly
      style={[styles.locateBtn, { backgroundColor: colors.white }]}
      onPress={onPress}
      variant="outline">
      <Ionicons name="navigate" size={24} color={colors.dark} />
    </Button>
  );
};

const styles = StyleSheet.create({
  locateBtn: {
    position: 'absolute',
    right: 20,
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
