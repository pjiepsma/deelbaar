import type { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  left?: ReactNode;
  right?: ReactNode;
};

export function AccountTopChrome({ left, right }: Props) {
  return (
    <View className="flex-row items-center justify-between" style={{ marginBottom: 16, minHeight: 44 }}>
      <View>{left ?? null}</View>
      <View>{right ?? null}</View>
    </View>
  );
}
