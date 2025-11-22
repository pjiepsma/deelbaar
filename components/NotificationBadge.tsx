import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, size = 'medium' }) => {
  if (count <= 0) return null;

  const sizeStyles = {
    small: styles.smallBadge,
    medium: styles.mediumBadge,
    large: styles.largeBadge,
  };

  const textSizeStyles = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  };

  return (
    <View style={[styles.badge, sizeStyles[size]]}>
      <Text style={[styles.badgeText, textSizeStyles[size]]}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EF4444', // Red color for notifications
    borderRadius: 10,
    position: 'absolute',
    top: -8,
    right: -8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  smallBadge: {
    minWidth: 16,
    height: 16,
  },
  mediumBadge: {
    minWidth: 20,
    height: 20,
  },
  largeBadge: {
    minWidth: 24,
    height: 24,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});
