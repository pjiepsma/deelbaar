import { Button } from "heroui-native";

import { SingleColorIcon } from "@/components/icons/single-color";

export interface SwapDirectionButtonProps {
  onPress: () => void;
}

export const SwapDirectionButton = ({ onPress }: SwapDirectionButtonProps): React.ReactElement => {
  return (
    <Button
      size="sm"
      variant="tertiary"
      accessibilityLabel="Swap From and To tokens"
      onPress={onPress}
      className="bg-surface-tertiary border-3 border-background"
    >
      <SingleColorIcon name="arrow-down" size={18} colorClassName="accent-foreground" />
    </Button>
  );
};
