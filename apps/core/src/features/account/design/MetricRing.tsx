import { Text, View } from 'react-native';

import { ACCOUNT_METRIC_RING_SIZE } from './accountTheme';

const SEGMENT_COLORS = ['#e2e8f0', '#a78bfa', '#7c3aed', '#4f46e5'] as const;

type Props = {
  filled: 1 | 2 | 3 | 4;
};

export function MetricRing({ filled }: Props) {
  const activeColor = SEGMENT_COLORS[filled - 1];

  return (
    <View
      style={{
        width: ACCOUNT_METRIC_RING_SIZE,
        height: ACCOUNT_METRIC_RING_SIZE,
        borderRadius: ACCOUNT_METRIC_RING_SIZE / 2,
        borderWidth: 4,
        borderColor: activeColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text className="text-foreground text-base font-bold">{`${filled}/4`}</Text>
      <Text className="text-muted text-xs">reach</Text>
    </View>
  );
}
