import { View } from "react-native";

import { SingleColorIcon } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";

import { InputButton } from "./input-button";

export interface ButtonGridProps {
  onDigit: (digit: string) => void;
  onDot: () => void;
  onBackspace: () => void;
  onClear: () => void;
}

interface GridItem {
  id: string;
  label: string;
  kind: "digit" | "dot" | "backspace";
}

const ITEMS: readonly GridItem[] = [
  { id: "1", label: "1", kind: "digit" },
  { id: "2", label: "2", kind: "digit" },
  { id: "3", label: "3", kind: "digit" },
  { id: "4", label: "4", kind: "digit" },
  { id: "5", label: "5", kind: "digit" },
  { id: "6", label: "6", kind: "digit" },
  { id: "7", label: "7", kind: "digit" },
  { id: "8", label: "8", kind: "digit" },
  { id: "9", label: "9", kind: "digit" },
  { id: "dot", label: ".", kind: "dot" },
  { id: "0", label: "0", kind: "digit" },
  { id: "backspace", label: "backspace", kind: "backspace" },
];

export const ButtonGrid = ({
  onDigit,
  onDot,
  onBackspace,
  onClear,
}: ButtonGridProps): React.ReactElement => {
  return (
    <View className="flex-row flex-wrap">
      {ITEMS.map((item) => {
        if (item.kind === "backspace") {
          return (
            <InputButton
              key={item.id}
              accessibilityLabel="Backspace"
              onPress={onBackspace}
              onLongPress={onClear}
            >
              <SingleColorIcon name="arrow-left" size={26} colorClassName="accent-foreground" />
            </InputButton>
          );
        }
        const handlePress = (): void => {
          if (item.kind === "dot") {
            onDot();
            return;
          }
          onDigit(item.label);
        };
        return (
          <InputButton key={item.id} accessibilityLabel={item.label} onPress={handlePress}>
            <AppText className="text-3xl font-semibold text-foreground">{item.label}</AppText>
          </InputButton>
        );
      })}
    </View>
  );
};
