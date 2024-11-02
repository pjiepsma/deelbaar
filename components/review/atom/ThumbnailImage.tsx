import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';

interface ThumbnailImageProps {
  uri: string;
  onPress: () => void;
}

const ThumbnailImage: React.FC<ThumbnailImageProps> = ({ uri, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <FastImage
        source={{ uri, priority: FastImage.priority.normal }}
        resizeMode={FastImage.resizeMode.cover}
        style={styles.thumbnail}
      />
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

export default ThumbnailImage;
