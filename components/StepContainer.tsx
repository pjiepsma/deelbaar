import { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '~/constants/Colors';
import ProgressIndicator from './ProgressIndicator';

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

export default function StepContainer({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  nextButton,
  stepLabels = []
}: StepContainerProps) {
  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={stepLabels}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.childrenContainer}>
          {children}
        </View>
      </View>

      {/* Next button */}
      {nextButton && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              nextButton.disabled && styles.nextButtonDisabled,
            ]}
            onPress={nextButton.onPress}
            disabled={nextButton.disabled || nextButton.loading}
          >
            <Text style={styles.nextButtonText}>
              {nextButton.loading ? 'Bezig...' : nextButton.title}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
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
    backgroundColor: Colors.primary,
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
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
