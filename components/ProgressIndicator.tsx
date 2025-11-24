import { View, Text } from 'react-native';
import Colors from '~/constants/Colors';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels = []
}: ProgressIndicatorProps) {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: Colors.primary,
          marginRight: 8
        }}>
          Stap {currentStep} van {totalSteps}
        </Text>
        <View style={{ flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
          <View
            style={{
              height: '100%',
              width: `${(currentStep / totalSteps) * 100}%`,
              backgroundColor: Colors.primary,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      {stepLabels.length > 0 && (
        <Text style={{
          fontSize: 12,
          color: '#6b7280',
          textAlign: 'center'
        }}>
          {stepLabels[currentStep - 1] || `Stap ${currentStep}`}
        </Text>
      )}
    </View>
  );
}
