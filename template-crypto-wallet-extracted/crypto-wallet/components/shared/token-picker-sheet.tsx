import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import {
  BottomSheet,
  PressableFeedback,
  SearchField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Keyboard, type ListRenderItem } from "react-native";

import { AssetListItem } from "@/components/assets/asset-list-item";
import { AppText } from "@/components/shared/app-text";
import { MOCK_ASSETS } from "@/lib/mocks/assets";
import type { Asset, AssetTicker } from "@/lib/types/asset";

const SELECTED_ROW_CLASSNAME = "rounded-2xl border border-dashed border-border px-2.5 -mx-2.5";

const SNAP_POINTS: string[] = ["85%"];

interface TokenPickerSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const TokenPickerSearchField = ({
  value,
  onChange,
}: TokenPickerSearchFieldProps): React.ReactElement => {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  return (
    <SearchField value={value} onChange={onChange} className="px-5">
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input
          variant="secondary"
          placeholder="Search tokens"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
};

export interface TokenPickerSheetProps {
  // Optional controlled mode. Omit both to let the sheet manage its own
  // open state — useful when only a `trigger` is provided.
  isOpen?: boolean;
  onOpenChange?: (value: boolean) => void;
  // Optional pressable slot rendered above the sheet. Tapping the trigger
  // opens the picker; the trigger itself is wrapped in a `PressableFeedback`
  // so callers only need to author the visual.
  trigger?: ReactNode;
  selectedTicker: AssetTicker;
  excludeTicker?: AssetTicker;
  onSelect: (ticker: AssetTicker) => void;
}

const matches = (asset: Asset, query: string): boolean => {
  if (query.length === 0) {
    return true;
  }
  const needle = query.trim().toLowerCase();
  return asset.name.toLowerCase().includes(needle) || asset.ticker.toLowerCase().includes(needle);
};

const keyExtractor = (asset: Asset): string => asset.ticker;

export const TokenPickerSheet = ({
  isOpen,
  onOpenChange,
  trigger,
  selectedTicker,
  excludeTicker,
  onSelect,
}: TokenPickerSheetProps): React.ReactElement => {
  const [query, setQuery] = useState<string>("");
  const [internalOpen, setInternalOpen] = useState<boolean>(false);

  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean): void => {
      if (onOpenChange !== undefined) {
        onOpenChange(value);
      }
      if (!isControlled) {
        setInternalOpen(value);
      }
    },
    [isControlled, onOpenChange],
  );

  const handleTriggerPress = useCallback((): void => {
    setOpen(true);
  }, [setOpen]);

  const visibleAssets = useMemo<Asset[]>(() => {
    return MOCK_ASSETS.filter((asset) => asset.ticker !== excludeTicker && matches(asset, query));
  }, [excludeTicker, query]);

  const handleSelect = useCallback(
    (ticker: AssetTicker): void => {
      onSelect(ticker);
      setOpen(false);
      setQuery("");
      Keyboard.dismiss();
    },
    [onSelect, setOpen],
  );

  const renderItem = useCallback<ListRenderItem<Asset>>(
    ({ item }) => {
      const isSelected = item.ticker === selectedTicker;
      return (
        <AssetListItem
          asset={item}
          showSparkline={false}
          onPress={() => handleSelect(item.ticker)}
          accessibilityLabel={`Select ${item.name}`}
          className={isSelected ? SELECTED_ROW_CLASSNAME : undefined}
        />
      );
    },
    [handleSelect, selectedTicker],
  );

  const renderEmpty = useCallback(
    (): React.ReactElement => (
      <AppText className="py-6 text-center text-sm text-muted">
        No tokens match &quot;{query}&quot;.
      </AppText>
    ),
    [query],
  );

  return (
    <>
      {trigger !== undefined ? (
        <PressableFeedback
          accessibilityRole="button"
          accessibilityLabel="Choose token"
          onPress={handleTriggerPress}
        >
          {trigger}
        </PressableFeedback>
      ) : null}
      <BottomSheet isOpen={open} onOpenChange={setOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay onPress={Keyboard.dismiss} />
          <BottomSheet.Content
            snapPoints={SNAP_POINTS}
            enableOverDrag={false}
            enableDynamicSizing={false}
            keyboardBehavior="extend"
            contentContainerClassName="h-full gap-0.5 px-0"
          >
            <TokenPickerSearchField value={query} onChange={setQuery} />
            <BottomSheetFlatList
              data={visibleAssets}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ListEmptyComponent={renderEmpty}
              contentContainerClassName="gap-1 py-4 px-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  );
};
