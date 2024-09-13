import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { ListRenderItem, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { Store } from '~/lib/powersync/AppSchema';

export const ListingItem: ListRenderItem<Store> = ({ item }) => {
  return (
    <Link href={`/listing/${item.id}`} asChild>
      <TouchableOpacity>
        <Animated.View style={styles.listing} entering={FadeInRight} exiting={FadeOutLeft}>
          {/*<Animated.Image source={{ uri: item.imageUrl }} style={styles.image} />*/}
          <TouchableOpacity style={{ position: 'absolute', right: 30, top: 30 }}>
            <Ionicons name="heart-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontFamily: 'mon-sb' }}>{item.name}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Ionicons name="star" size={16} />
              {/*<Text style={{ fontFamily: 'mon-sb' }}>{item.review_scores_rating / 20}</Text>*/}
            </View>
          </View>
          <Text style={{ fontFamily: 'mon' }}>{item.description}</Text>
          {/*<Text style={{ fontFamily: 'mon' }}>{item.room_type}</Text>*/}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {/*<Text style={{ fontFamily: 'mon-sb' }}>€ {item.price}</Text>*/}
            <Text style={{ fontFamily: 'mon' }}>night</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  listing: {
    padding: 16,
    gap: 10,
    marginVertical: 0,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  info: {
    textAlign: 'center',
    fontFamily: 'mon-sb',
    fontSize: 16,
    marginTop: 4,
  },
});
