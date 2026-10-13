import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { PressableFeedback, useThemeColor } from 'heroui-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  value?: string;
};

const ICON_BOX = 40;

export function AccountIconRow({ icon, label, onPress, value }: Props) {
  const foreground = useThemeColor('foreground');

  return (
    <PressableFeedback onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View className="flex-row items-center" style={{ gap: 14, minHeight: 52, paddingVertical: 6 }}>
        <View
          className="bg-accent/12 items-center justify-center"
          style={{ width: ICON_BOX, height: ICON_BOX, borderRadius: ICON_BOX / 2 }}
        >
          <Ionicons name={icon} size={20} color={foreground} />
        </View>
        <Text className="text-foreground flex-1 text-base font-medium" numberOfLines={1}>
          {label}
        </Text>
        {value ? (
          <Text className="text-muted text-sm" numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
    </PressableFeedback>
  );
}
