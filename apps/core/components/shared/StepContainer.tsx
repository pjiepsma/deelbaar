import { ReactNode, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppColorPalette } from '~/lib/theme/types';
import { screenTitle } from '~/constants/Typography';
import ProgressIndicator from './ProgressIndicator';
import { useAppColors } from '~/lib/theme';

interface StepContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  nextButton?: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  stepLabels?: string[];
}

function createStyles(colors: AppColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    title: {
      ...screenTitle,
      color: colors.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      lineHeight: 22,
      marginBottom: 24,
    },
    childrenContainer: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    nextButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}

export default function StepContainer({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  nextButton,
  stepLabels = [],
}: StepContainerProps) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={stepLabels}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.childrenContainer}>{children}</View>
      </View>

      {nextButton && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, nextButton.disabled && styles.nextButtonDisabled]}
            onPress={nextButton.onPress}
            disabled={nextButton.disabled || nextButton.loading}>
            <Text style={styles.nextButtonText}>
              {nextButton.loading ? 'Bezig...' : nextButton.title}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
