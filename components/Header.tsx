import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '~/constants/Colors';

interface HeaderProps {
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

const Header = ({ onNotificationsPress, onProfilePress }: HeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onNotificationsPress} style={styles.notifications} />
        <Text style={styles.headerText}>Deelbaar</Text>
        <TouchableOpacity onPress={onNotificationsPress} style={styles.notifications}>
          <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    backgroundColor: '#fff',
  },
  filter: {
    paddingLeft: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifications: {
    paddingRight: 10,
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    color: Colors.primary,
    fontSize: 30,
  },
});
