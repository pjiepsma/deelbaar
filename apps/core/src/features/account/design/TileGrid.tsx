import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Chip, PressableFeedback, Surface } from 'heroui-native';

import { ACCOUNT_TILE_GAP, ACCOUNT_TILE_RADIUS } from './accountTheme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Tile = {
  key: string;
  icon: IoniconName;
  label: string;
  value?: string;
  onPress: () => void;
};

type Props = {
  tiles: Tile[];
};

const TILE_MIN_HEIGHT = 100;
const ICON_BG_SIZE = 40;
const ICON_SIZE = 20;

export function TileGrid({ tiles }: Props) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: ACCOUNT_TILE_GAP }}>
      {tiles.map((tile) => {
        return (
          <View key={tile.key} style={{ width: '48%' }}>
            <PressableFeedback onPress={tile.onPress} accessibilityLabel={tile.label}>
              <Surface
                className="bg-surface"
                style={{
                  borderRadius: ACCOUNT_TILE_RADIUS,
                  padding: 16,
                  minHeight: TILE_MIN_HEIGHT,
                  gap: 8,
                }}
              >
                <View
                  className="bg-accent/20"
                  style={{
                    width: ICON_BG_SIZE,
                    height: ICON_BG_SIZE,
                    borderRadius: ICON_BG_SIZE / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={tile.icon} size={ICON_SIZE} color="#7c3aed" />
                </View>
                <Text className="text-foreground text-sm font-semibold">{tile.label}</Text>
                {tile.value ? (
                  <Chip variant="secondary" size="sm">
                    <Chip.Label>{tile.value}</Chip.Label>
                  </Chip>
                ) : null}
              </Surface>
            </PressableFeedback>
          </View>
        );
      })}
    </View>
  );
}
