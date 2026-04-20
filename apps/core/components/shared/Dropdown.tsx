import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Select } from 'heroui-native/select';

import type { OptionItem } from '~/constants/Types';
import { useAppColors } from '~/lib/theme';

interface Props {
  label: string;
  data: OptionItem[];
  onSelect: (item: OptionItem) => void;
}

/**
 * Single-select dropdown — HeroUI Select with popover presentation (floating menu).
 */
const Dropdown: React.FC<Props> = ({ label, data, onSelect }) => {
  const colors = useAppColors();
  const [selected, setSelected] = useState<OptionItem>(data[0]);
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => ({ value: selected.value, label: selected.value }),
    [selected.value]
  );

  const handleValueChange = (opt: { value: string; label: string } | undefined) => {
    if (!opt) return;
    const item = data.find((d) => d.value === opt.value);
    if (item) {
      setSelected(item);
      onSelect(item);
    }
  };

  return (
    <Select
      value={selectedOption}
      onValueChange={handleValueChange}
      isOpen={open}
      onOpenChange={setOpen}>
      <Select.Trigger variant="unstyled" asChild>
        <Pressable
          style={[
            styles.trigger,
            {
              backgroundColor: colors.white,
              ...colors.shadowTokens.md,
            },
          ]}>
          <Ionicons name={selected.icon} size={24} color={colors.text.primary} />
          <Ionicons
            name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={22}
            color={colors.text.primary}
          />
        </Pressable>
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay />
        <Select.Content presentation="popover" placement="bottom" width={280}>
          <Select.ListLabel className="text-xs font-semibold text-muted">{label}</Select.ListLabel>
          {data.map((item) => (
            <Select.Item key={item.value} value={item.value} label={item.value}>
              <View style={styles.itemRow}>
                <Ionicons name={item.icon} size={22} color={colors.text.primary} />
                <Select.ItemLabel />
              </View>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
});

export default Dropdown;
