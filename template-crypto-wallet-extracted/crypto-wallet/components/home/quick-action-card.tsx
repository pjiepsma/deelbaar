import { PressableFeedback, Surface } from "heroui-native";
import { View } from "react-native";

import { SingleColorIcon, type SingleColorIconName } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";
import { fireHaptic } from "@/lib/utils/fire-haptic";

export interface QuickActionCardProps {
  label: string;
  iconName: SingleColorIconName;
  onPress?: () => void;
}

export const QuickActionCard = ({
  label,
  iconName,
  onPress,
}: QuickActionCardProps): React.ReactElement => {
  // Only fire haptic feedback when there's a real handler — otherwise a
  // non-wired tile would buzz for no reason.
  const handlePress =
    onPress === undefined
      ? undefined
      : (): void => {
          fireHaptic();
          onPress();
        };

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      className="rounded-3xl"
    >
      <Surface className="size-28 gap-2 rounded-3xl justify-between">
        <View className="size-8 items-center justify-center rounded-full bg-separator-secondary/30">
          <SingleColorIcon name={iconName} size={18} colorClassName="accent-foreground" />
        </View>
        <AppText className="text-sm font-medium text-foreground">{label}</AppText>
      </Surface>
    </PressableFeedback>
  );
};
