import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import Colors from '~/constants/Colors';

interface FullImageModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null;
}

const FullImageModal: React.FC<FullImageModalProps> = ({ visible, onClose, imageUri }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen">
      <StatusBar backgroundColor="white" />
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Ionicons name="close-outline" size={24} color={Colors.light} />
        </TouchableOpacity>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="cover" />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
    top: 20,
    right: 20,
    zIndex: 2,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

export default FullImageModal;
