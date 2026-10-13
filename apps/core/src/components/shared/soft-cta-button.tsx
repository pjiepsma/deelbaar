import { Button } from 'heroui-native';
import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  BRAND_SOFT_CTA_CLASS,
  BRAND_SOFT_CTA_LABEL_CLASS,
  SOFT_CTA_FILL,
  SOFT_CTA_INK,
} from '../../branding/colors';

type Props = {
  label: string;
  onPress?: () => void;
  isDisabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  startIcon?: ReactNode;
  testID?: string;
};

/**
 * Soft / secondary CTA (Thuisbezorgd account): white fill + ink label, no border.
 */
export function SoftCtaButton({
  label,
  startIcon,
  className,
  style,
  onPress,
  isDisabled,
  accessibilityLabel,
  testID,
}: Props) {
  return (
    <Button
      testID={testID}
      variant="secondary"
      onPress={onPress}
      isDisabled={isDisabled}
      accessibilityLabel={accessibilityLabel}
      className={[BRAND_SOFT_CTA_CLASS, className].filter(Boolean).join(' ')}
      style={[{ backgroundColor: SOFT_CTA_FILL, borderWidth: 0 }, style]}
    >
      <Button.Label className={BRAND_SOFT_CTA_LABEL_CLASS}>
        {startIcon ? (
          <View className="flex-row items-center gap-3">
            {startIcon}
            <Text style={{ fontSize: 17, fontWeight: '600', color: SOFT_CTA_INK }}>{label}</Text>
          </View>
        ) : (
          <Text style={{ fontWeight: '600', color: SOFT_CTA_INK }}>{label}</Text>
        )}
      </Button.Label>
    </Button>
  );
}
