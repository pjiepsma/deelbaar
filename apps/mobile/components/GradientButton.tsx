import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: [string, string];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'accent';
  icon?: React.ReactNode;
}

export default function GradientButton({
  title,
  onPress,
  colors,
  style,
  textStyle,
  disabled = false,
  size = 'medium',
  variant = 'primary',
  icon,
}: GradientButtonProps) {
  const getGradientColors = () => {
    if (colors) return colors;

    switch (variant) {
      case 'secondary':
        return Colors.gradients.secondary;
      case 'accent':
        return Colors.gradients.accent;
      default:
        return Colors.gradients.primary;
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];

    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`]];

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Colors.radius.lg,
    overflow: 'hidden',
    ...Colors.shadowTokens.md,
  },
  small: {
    minHeight: 40,
    paddingHorizontal: Colors.spacing.md,
    paddingVertical: Colors.spacing.xs,
  },
  medium: {
    minHeight: 56,
    paddingHorizontal: Colors.spacing.lg,
    paddingVertical: Colors.spacing.sm,
  },
  large: {
    minHeight: 64,
    paddingHorizontal: Colors.spacing.xl,
    paddingVertical: Colors.spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Colors.spacing.sm,
  },
  icon: {
    marginRight: Colors.spacing.xs,
  },
  text: {
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
});



