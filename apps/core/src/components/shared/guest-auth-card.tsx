import { Button, Surface } from 'heroui-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface GuestAuthCardProps {
  icon: ReactNode;
  headline: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
  compact?: boolean;
}

export function GuestAuthCard({
  icon,
  headline,
  description,
  ctaLabel,
  onPress,
  compact = false,
}: GuestAuthCardProps) {
  return (
    <Surface className={compact ? 'rounded-2xl p-3' : 'rounded-2xl p-4'}>
      <View className="flex-row items-start" style={{ gap: compact ? 8 : 12 }}>
        <View className="mt-0.5">{icon}</View>
        <View className="min-w-0 flex-1" style={{ gap: compact ? 2 : 4 }}>
          <Text className="text-foreground text-base font-semibold" maxFontSizeMultiplier={1.4}>
            {headline}
          </Text>
          <Text
            className={compact ? 'text-muted text-sm leading-4' : 'text-muted text-sm leading-5'}
            maxFontSizeMultiplier={1.4}
          >
            {description}
          </Text>
        </View>
      </View>
      <Button variant="primary" onPress={onPress} className={compact ? 'mt-3 w-full' : 'mt-4 w-full'}>
        <Button.Label>{ctaLabel}</Button.Label>
      </Button>
    </Surface>
  );
}
