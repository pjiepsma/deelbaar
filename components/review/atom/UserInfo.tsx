import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Rating } from 'react-native-elements';

interface UserInfoProps {
  userName: string;
  rating: number;
  date: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ rating, date }) => {
  const dutchDate = new Date(date).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View>
      <View style={styles.ratingRow}>
        <Rating imageSize={16} readonly startingValue={rating} />
        <Text style={styles.date}>• {dutchDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: '#666',
    marginLeft: 8,
  },
});

export default UserInfo;
