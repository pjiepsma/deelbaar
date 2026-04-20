import { View, Text } from 'react-native';

import { useAppColors } from '~/lib/theme';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels = [],
}: ProgressIndicatorProps) {
  const colors = useAppColors();

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
            marginRight: 8,
          }}>
          Stap {currentStep} van {totalSteps}
        </Text>
        <View
          style={{
            flex: 1,
            height: 4,
            backgroundColor: colors.border.light,
            borderRadius: 2,
          }}>
          <View
            style={{
              height: '100%',
              width: `${(currentStep / totalSteps) * 100}%`,
              backgroundColor: colors.primary,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      {stepLabels.length > 0 && (
        <Text
          style={{
            fontSize: 12,
            color: colors.text.secondary,
            textAlign: 'center',
          }}>
          {stepLabels[currentStep - 1] || `Stap ${currentStep}`}
        </Text>
      )}
    </View>
  );
}
