import { Button, Surface } from 'heroui-native';

import { ACCOUNT_ACTION_BAR_HEIGHT } from './accountTheme';

type Props = {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  isPending?: boolean;
};

export function StickyActionBar({ primaryLabel, onPrimary, secondaryLabel, onSecondary, isPending }: Props) {
  return (
    <Surface
      className="bg-surface"
      style={{
        minHeight: ACCOUNT_ACTION_BAR_HEIGHT,
        borderRadius: 20,
        padding: 12,
        gap: 8,
      }}
    >
      <Button variant="primary" onPress={onPrimary} isDisabled={isPending} className="w-full">
        <Button.Label>{primaryLabel}</Button.Label>
      </Button>
      {secondaryLabel && onSecondary ? (
        <Button variant="ghost" onPress={onSecondary} isDisabled={isPending}>
          <Button.Label>{secondaryLabel}</Button.Label>
        </Button>
      ) : null}
    </Surface>
  );
}
