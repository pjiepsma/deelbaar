import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function LoadingSkeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: LoadingSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface CardSkeletonProps {
  style?: any;
}

export function CardSkeleton({ style }: CardSkeletonProps) {
  return (
    <View style={[defaultStyles.card, styles.cardSkeleton, style]}>
      <View style={styles.cardHeaderSkeleton}>
        <LoadingSkeleton width={120} height={20} />
        <LoadingSkeleton width={32} height={32} borderRadius={16} />
      </View>

      <LoadingSkeleton width="80%" height={16} />
      <LoadingSkeleton width="60%" height={12} />

      <View style={styles.cardMetaSkeleton}>
        <LoadingSkeleton width={60} height={20} borderRadius={10} />
        <LoadingSkeleton width={80} height={16} />
      </View>
    </View>
  );
}

interface ListSkeletonProps {
  count?: number;
  style?: any;
}

export function ListSkeleton({ count = 3, style }: ListSkeletonProps) {
  return (
    <View style={[styles.listSkeleton, style]}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.background.tertiary,
  },
  cardSkeleton: {
    gap: 12,
  },
  cardHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetaSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listSkeleton: {
    gap: 16,
  },
});





