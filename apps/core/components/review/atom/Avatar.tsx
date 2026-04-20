import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import Colors from '~/constants/Colors';

interface UserInfoProps {
  name: string;
  uri?: string | null;
  size?: number;
}

const Color = {
  GREEN: '#A0CFA0',
  BLUE: '#8BBEDD',
  YELLOW: '#D4D200',
  CYAN: '#7FD6D6',
  GRAY: '#B0B0B0',
  BEIGE: '#D9D9A0',
  MINT: '#7EC7C7',
  PEACH: '#FFCBA4',
};

function getRandomColor() {
  const colors = Object.values(Color);
  return colors[Math.floor(Math.random() * colors.length)];
}

const Avatar: React.FC<UserInfoProps> = ({ name, uri, size = 40 }) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: '#D9D9A0', width: size, height: size, borderRadius: size / 2 },
        ]}>
        {uri ? (
          <Image source={{ uri }} resizeMode="cover" style={styles.image} />
        ) : (
          <Text style={styles.avatarText}>{name}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: Colors.light,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Avatar;
