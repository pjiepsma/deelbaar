import { PressableFeedback } from "heroui-native";
import type { ReactNode } from "react";

import { fireHaptic } from "@/lib/utils/fire-haptic";

export interface InputButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  children: ReactNode;
}

export const InputButton = ({
  onPress,
  onLongPress,
  accessibilityLabel,
  children,
}: InputButtonProps): React.ReactElement => {
  const handlePress = (): void => {
    fireHaptic();
    onPress();
  };
  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      onLongPress={onLongPress}
      className="h-16 w-1/3 rounded-2xl items-center justify-center"
      animation={{
        scale: {
          value: 0.95,
        },
      }}
    >
      {children}
    </PressableFeedback>
  );
};
