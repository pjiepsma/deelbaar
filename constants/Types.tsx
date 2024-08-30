import { Ionicons } from "@expo/vector-icons";

export type OptionItem = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};
