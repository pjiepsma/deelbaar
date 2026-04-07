import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '~/constants/Colors';

interface HikeItemProps {
  onPress: () => void;
}

const ListingCard: React.FC<HikeItemProps> = ({ onPress }) => {
  return (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Helaas, geen minibiebs in dit gebied.</Text>
        <Text style={styles.subtitle}>Probeer een andere locatie</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Expand search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 170,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#777',
    fontSize: 14,
  },
  button: {
    width: 150,
    alignItems: 'center',
    borderColor: Colors.border,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  buttonText: {
    color: Colors.dark,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ListingCard;
