import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

interface ThumbnailImageProps {
  uri: string;
  onPress: () => void;
}

const Thumbnail: React.FC<ThumbnailImageProps> = ({ uri, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Image source={{ uri }} resizeMode="cover" style={styles.thumbnail} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    marginTop: 8,
    borderRadius: 10,
    width: '100%',
    height: 200,
  },
});

export default Thumbnail;
