import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface UserInfoProps {
  userName: string;
  rating: number;
  date: string;
}

const TOTAL_STARS = 5;

const UserInfo: React.FC<UserInfoProps> = ({ rating, date }) => {
  const dutchDate = useMemo(
    () =>
      new Date(date).toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [date]
  );

  const stars = useMemo(() => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    return Array.from({ length: TOTAL_STARS }).map((_, index) => {
      if (index < fullStars) {
        return 'star';
      }
      if (index === fullStars && hasHalfStar) {
        return 'star-half';
      }
      return 'star-outline';
    });
  }, [rating]);

  return (
    <View>
      <View style={styles.ratingRow}>
        {stars.map((icon, index) => (
          <Ionicons key={index} name={icon as any} size={16} color="#fbbf24" style={styles.star} />
        ))}
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
  star: {
    marginRight: 2,
  },
  date: {
    color: '#666',
    marginLeft: 8,
  },
});

export default UserInfo;
