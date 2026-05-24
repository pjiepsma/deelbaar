import { Button, Select } from "heroui-native";
import { View } from "react-native";
import { Uniwind, useUniwind } from "uniwind";

import { SingleColorIcon, type SingleColorIconName } from "@/components/icons/single-color";

type ThemeId = "light" | "dark" | "system";

interface ThemeOption {
  id: ThemeId;
  label: string;
  iconName: SingleColorIconName;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: "light", label: "Light", iconName: "sun" },
  { id: "dark", label: "Dark", iconName: "moon" },
  { id: "system", label: "System", iconName: "display" },
];

const FALLBACK_OPTION: ThemeOption = THEME_OPTIONS[0];

// `Select`'s callback ships the raw option object with a wide `string` value;
// we narrow it back to `ThemeId` via `isThemeId` before forwarding to Uniwind.
type LooseSelectOption = { value: string; label: string } | undefined;

const isThemeId = (value: string): value is ThemeId => {
  return THEME_OPTIONS.some((option) => option.id === value);
};

const resolveOption = (id: ThemeId): ThemeOption => {
  return THEME_OPTIONS.find((option) => option.id === id) ?? FALLBACK_OPTION;
};

export const ThemeSelect = (): React.ReactElement => {
  const { theme, hasAdaptiveThemes } = useUniwind();
  // Uniwind reports the resolved theme name (`"light"` / `"dark"`) even when
  // the user picked `"system"` — `hasAdaptiveThemes` is the only signal that
  // tells us system-following is active. Surface that as the picker value so
  // the UI reflects the user's actual preference, not its resolved variant.
  const activeId: ThemeId = hasAdaptiveThemes ? "system" : theme;

  const selectedOption = resolveOption(activeId);
  const selectedValue = {
    value: selectedOption.id,
    label: selectedOption.label,
  };

  const handleValueChange = (next: LooseSelectOption): void => {
    if (next === undefined) {
      return;
    }
    if (!isThemeId(next.value)) {
      return;
    }
    Uniwind.setTheme(next.value);
  };

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <Select.Trigger variant="unstyled" asChild>
        <Button isIconOnly variant="tertiary" size="sm" accessibilityLabel="Switch theme">
          <SingleColorIcon name="gear" size={18} colorClassName="accent-foreground" />
        </Button>
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay />
        <Select.Content presentation="popover" placement="bottom" align="end" width={200}>
          {THEME_OPTIONS.map((option) => (
            <Select.Item key={option.id} value={option.id} label={option.label}>
              <View className="flex-row items-center gap-2 flex-1">
                <SingleColorIcon name={option.iconName} size={16} colorClassName="accent-muted" />
                <Select.ItemLabel />
              </View>
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
};
