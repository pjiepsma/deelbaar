import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

import Colors from '~/constants/Colors';

const { width } = Dimensions.get('window');

interface RegistrationSuccessModalProps {
  visible: boolean;
  onContinue: () => void;
}

export default function RegistrationSuccessModal({
  visible,
  onContinue,
}: RegistrationSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>

          <Text style={styles.title}>Welkom bij Deelbaar!</Text>
          <Text style={styles.subtitle}>Je account is succesvol aangemaakt</Text>

          <Text style={styles.description}>
            Je bent nu automatisch ingelogd en kunt direct beginnen met het ontdekken van minibiebs,
            je favorieten beheren, en zelfs je eigen minibieb toevoegen aan de kaart.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="map" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Ontdek minibiebs op de kaart</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Bewaar je favorieten</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="home" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Voeg je eigen minibieb toe</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Deel foto\'s met de community</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Aan de slag!</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
