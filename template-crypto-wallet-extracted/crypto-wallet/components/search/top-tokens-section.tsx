import { LinearGradient } from "expo-linear-gradient";
import { Button, colorKit, ScrollShadow, Select, Text, useThemeColor } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { useCallback, useMemo } from "react";
import { FlatList, type ListRenderItem, View } from "react-native";
import { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { AssetListItem } from "@/components/assets/asset-list-item";
import { SingleColorIcon } from "@/components/icons/single-color";
import {
  TOKEN_SORT_OPTIONS,
  type TokenSortOption,
  type TokenSortOptionId,
} from "@/lib/config/token-sort";
import { MOCK_ASSETS } from "@/lib/mocks/assets";
import type { Asset } from "@/lib/types/asset";
import { sortAssets } from "@/lib/utils/sort-assets";

const StyledLinearGradient = withUniwind(LinearGradient);

interface SortSelectOption {
  value: TokenSortOptionId;
  label: string;
}

// `Select`'s callback ships the raw option object with a wide `string` value;
// we narrow it back to `TokenSortOptionId` via `isSortOptionId` below.
type LooseSelectOption = { value: string; label: string } | undefined;

export interface TopTokensSectionProps {
  query: string;
  sortId: TokenSortOptionId;
  onSortChange: (sortId: TokenSortOptionId) => void;
}

const FALLBACK_OPTION: TokenSortOption = TOKEN_SORT_OPTIONS[0];

const matchesQuery = (asset: Asset, query: string): boolean => {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) {
    return true;
  }
  return asset.name.toLowerCase().includes(trimmed) || asset.ticker.toLowerCase().includes(trimmed);
};

const resolveOption = (sortId: TokenSortOptionId): TokenSortOption => {
  return TOKEN_SORT_OPTIONS.find((option) => option.id === sortId) ?? FALLBACK_OPTION;
};

const isSortOptionId = (value: string): value is TokenSortOptionId => {
  return TOKEN_SORT_OPTIONS.some((option) => option.id === value);
};

const renderTopTokenItem: ListRenderItem<Asset> = ({ item }) => (
  <AssetListItem asset={item} showSparkline={false} />
);

const keyExtractor = (asset: Asset): string => asset.id;

export const TopTokensSection = ({
  query,
  sortId,
  onSortChange,
}: TopTokensSectionProps): React.ReactElement => {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor("background");

  const selectedOption = resolveOption(sortId);

  const visibleAssets = useMemo<readonly Asset[]>(() => {
    const filtered = MOCK_ASSETS.filter((asset) => matchesQuery(asset, query));
    return sortAssets(filtered, sortId);
  }, [query, sortId]);

  const selectedValue: SortSelectOption = {
    value: selectedOption.id,
    label: selectedOption.label,
  };

  const handleValueChange = (next: LooseSelectOption): void => {
    if (next === undefined) {
      return;
    }
    if (!isSortOptionId(next.value)) {
      return;
    }
    onSortChange(next.value);
  };

  // FlatList expects a mutable array; the in-component `visibleAssets` is
  // readonly so we copy once at render time.
  const data = useMemo<Asset[]>(() => [...visibleAssets], [visibleAssets]);

  const renderEmpty = useCallback(
    (): React.ReactElement => (
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <SingleColorIcon name="search" size={20} colorClassName="accent-muted" />
          </EmptyState.Media>
          <EmptyState.Title>No tokens found</EmptyState.Title>
          <EmptyState.Description>
            {`No tokens match "${query}". Try a different search.`}
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    ),
    [query],
  );

  return (
    <View className="flex-1 gap-1">
      <View className="px-5 flex-row items-center justify-between gap-3">
        <Text.Heading type="h6" color="muted">
          Top tokens
        </Text.Heading>
        <Select value={selectedValue} onValueChange={handleValueChange}>
          <Select.Trigger variant="unstyled" asChild>
            <Button
              layout={LinearTransition.springify()}
              variant="tertiary"
              size="sm"
              className="h-9"
            >
              <Select.Value
                placeholder={selectedOption.label}
                className="flex-auto text-sm font-medium"
              />
              <Select.TriggerIndicator iconProps={{ size: 14 }} />
            </Button>
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover" placement="bottom" align="start" width={280}>
              {TOKEN_SORT_OPTIONS.map((option) => (
                <Select.Item key={option.id} value={option.id} label={option.label}>
                  <View className="flex-row items-center gap-2 flex-1">
                    <SingleColorIcon
                      name={option.iconName}
                      size={16}
                      colorClassName="accent-muted"
                    />
                    <Select.ItemLabel />
                  </View>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      </View>
      <View className="flex-1">
        <ScrollShadow
          LinearGradientComponent={LinearGradient}
          size={insets.bottom + 250}
          visibility="bottom"
        >
          <FlatList
            data={data}
            renderItem={renderTopTokenItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={<View className="h-32" />}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pt-3"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        </ScrollShadow>
        <StyledLinearGradient
          colors={[
            colorKit.setAlpha(backgroundColor, 1).hex(),
            colorKit.setAlpha(backgroundColor, 0).hex(),
          ]}
          className="absolute top-0 left-0 right-0 h-10"
          pointerEvents="none"
        />
      </View>
    </View>
  );
};
