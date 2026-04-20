import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Popover } from 'heroui-native/popover';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAppColors } from '~/lib/theme';
import { getCategoryIcon, getCategoryColor } from '~/lib/utils/categoryHelpers';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Alle locaties', icon: 'grid' },
  { value: 'book', label: 'Minibieb' },
  { value: 'food', label: 'Voedselkast' },
  { value: 'hygiene', label: 'Hygiënekast' },
  { value: 'community', label: 'Gemeenschapskast' },
  { value: 'farm', label: 'Boerderijautomaat' },
  { value: 'other', label: 'Anders' },
] as const;

interface MapCategoryFilterProps {
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

/**
 * Category filter anchored to the trigger — HeroUI Popover (“dropdown”), not a bottom sheet.
 */
export const MapCategoryFilter = React.memo<MapCategoryFilterProps>(
  ({ selectedCategories, onCategoryToggle }) => {
    const colors = useAppColors();
    const { width: screenW } = useWindowDimensions();
    const panelWidth = useMemo(() => Math.min(300, Math.max(240, screenW - 32)), [screenW]);
    const [open, setOpen] = useState(false);

    const active = selectedCategories.length > 0;

    const handleToggle = useCallback(
      (category: string) => {
        if (category === 'all') {
          selectedCategories.forEach((cat) => onCategoryToggle(cat));
        } else {
          onCategoryToggle(category);
        }
      },
      [onCategoryToggle, selectedCategories]
    );

    return (
      <Popover isOpen={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <View
            style={[
              styles.trigger,
              {
                backgroundColor: active ? colors.background.secondary : colors.background.tertiary,
                borderColor: colors.border.light,
                borderRadius: colors.radius.md,
                ...colors.shadowTokens.md,
              },
            ]}>
            {selectedCategories.length === 0 ? (
              <>
                <FontAwesome5 name="th-large" size={18} color={colors.icon.active} solid />
                <Text style={[styles.triggerLabel, { color: colors.icon.active }]}>Type</Text>
              </>
            ) : (
              <View style={styles.triggerIcons}>
                {selectedCategories.slice(0, 3).map((category) => (
                  <View
                    key={category}
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${getCategoryColor(category)}20` },
                    ]}>
                <FontAwesome5
                  name={getCategoryIcon(category) as any}
                  size={16}
                  color={getCategoryColor(category)}
                  solid
                />
                  </View>
                ))}
                {selectedCategories.length > 3 ? (
                  <View
                    style={[
                      styles.morePill,
                      {
                        backgroundColor: colors.icon.active,
                        borderRadius: colors.radius.md,
                      },
                    ]}>
                    <Text style={styles.morePillText}>+{selectedCategories.length - 3}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Overlay className="bg-black/20" />
          <Popover.Content
            presentation="popover"
            placement="bottom"
            width={panelWidth}
            className="rounded-2xl border border-border bg-overlay p-0 shadow-lg">
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sheetTitle, { color: colors.text.tertiary }]}>Type locatie</Text>
            </View>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {CATEGORY_OPTIONS.map((category) => {
                const isSelected =
                  category.value === 'all'
                    ? selectedCategories.length === 0
                    : selectedCategories.includes(category.value);
                const iconBgColor =
                  category.value === 'all'
                    ? isSelected
                      ? colors.primary
                      : colors.border.light
                    : isSelected
                      ? getCategoryColor(category.value)
                      : colors.border.light;
                const iconColor =
                  category.value === 'all'
                    ? isSelected
                      ? '#fff'
                      : colors.text.tertiary
                    : isSelected
                      ? '#fff'
                      : getCategoryColor(category.value);
                const checkColor =
                  category.value === 'all' ? colors.primary : getCategoryColor(category.value);

                return (
                  <Pressable
                    key={category.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleToggle(category.value)}
                    style={({ pressed }) => (pressed ? { opacity: 0.75 } : undefined)}>
                    <View style={[styles.row, { borderBottomColor: colors.border.light }]}>
                      <View style={styles.rowLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                          <FontAwesome5
                            name={
                              (category.value === 'all'
                                ? 'th-large'
                                : getCategoryIcon(category.value)) as any
                            }
                            size={18}
                            color={iconColor}
                            solid={isSelected}
                          />
                        </View>
                        <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
                          {category.label}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={20} color={checkColor} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    );
  }
);

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 100,
    gap: 6,
    borderWidth: 1,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  triggerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
