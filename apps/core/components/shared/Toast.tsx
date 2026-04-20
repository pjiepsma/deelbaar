import React, { useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: Colors.success,
          backgroundColor: Colors.success + '10',
          borderColor: Colors.success + '30',
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: Colors.error,
          backgroundColor: Colors.error + '10',
          borderColor: Colors.error + '30',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: Colors.warning,
          backgroundColor: Colors.warning + '10',
          borderColor: Colors.warning + '30',
        };
      default:
        return {
          icon: 'information-circle',
          color: Colors.info,
          backgroundColor: Colors.info + '10',
          borderColor: Colors.info + '30',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}>
      <View style={styles.toastContent}>
        <Ionicons name={config.icon as any} size={24} color={config.color} />
        <Text style={[styles.toastText, { color: Colors.text.primary }]}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.toastClose}>
          <Ionicons name="close" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: Colors.radius.lg,
    padding: Colors.spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Colors.spacing.sm,
  },
  toastText: {
    ...defaultStyles.text.bodyMedium,
    flex: 1,
  },
  toastClose: {
    padding: Colors.spacing.xs,
  },
});
