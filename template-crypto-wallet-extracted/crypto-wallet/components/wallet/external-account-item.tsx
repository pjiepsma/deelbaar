import { PressableFeedback } from "heroui-native";
import { View } from "react-native";

import { MultiColorIcon, type MultiColorIconName } from "@/components/icons/multi-color";
import { SingleColorIcon } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";

/**
 * Names of exchange brands an external-account row can display. Constrained to
 * the brand subset of `MultiColorIconName` so call-sites can't accidentally
 * pass a crypto ticker key.
 */
export type ExternalAccountIconName = Extract<MultiColorIconName, "binance" | "coinbase">;

export interface ExternalAccountItemProps {
  label: string;
  description?: string;
  iconName: ExternalAccountIconName;
  onPress?: () => void;
}

const ICON_TILE_SIZE = 44;

export const ExternalAccountItem = ({
  label,
  description,
  iconName,
  onPress,
}: ExternalAccountItemProps): React.ReactElement => {
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-separator-secondary/80 p-3"
    >
      <MultiColorIcon name={iconName} size={ICON_TILE_SIZE} />
      <View className="flex-1">
        <AppText className="text-base font-semibold text-foreground" numberOfLines={1}>
          {label}
        </AppText>
        {description !== undefined ? (
          <AppText className="text-xs text-muted" numberOfLines={1}>
            {description}
          </AppText>
        ) : null}
      </View>
      <SingleColorIcon name="chevron-right" size={18} colorClassName="accent-muted" />
      <PressableFeedback.Ripple />
    </PressableFeedback>
  );
};
