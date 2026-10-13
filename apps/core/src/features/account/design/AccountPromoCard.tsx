import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Card, PressableFeedback, useThemeColor } from 'heroui-native';

import { AccountSectionTitle } from './AccountSectionTitle';
import {
  ACCOUNT_CARD_RADIUS,
  ACCOUNT_PROMO_CARD_CLASS,
  ACCOUNT_PROMO_COMPACT_PAD,
  ACCOUNT_PROMO_PAD,
  ACCOUNT_SUBTITLE_CLASS,
} from './accountTheme';

type Props = {
  title: string;
  subtitle?: string;
  washColor: string;
  washClassName?: string;
  art: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Trailing chevron (Need help navigation affordance). */
  showChevron?: boolean;
  /** Tighter pad + centered row (Need help — less tall than Join). */
  compact?: boolean;
};

/**
 * Flat tinted promo card shell — Join + Need help share radius/title; Help can be compact + chevron.
 */
export function AccountPromoCard({
  title,
  subtitle,
  washColor,
  washClassName,
  art,
  body,
  footer,
  onPress,
  accessibilityLabel,
  showChevron = false,
  compact = false,
}: Props) {
  const [foreground] = useThemeColor(['foreground']);
  const pad = compact ? ACCOUNT_PROMO_COMPACT_PAD : ACCOUNT_PROMO_PAD;

  const content = (
    <Card.Body style={{ padding: pad, gap: compact ? 8 : 12, flexGrow: 0 }}>
      <View className={`flex-row gap-3 ${compact ? 'items-center' : 'items-start'}`}>
        <View className="min-w-0 flex-1 gap-1">
          <AccountSectionTitle>{title}</AccountSectionTitle>
          {subtitle ? <Text className={ACCOUNT_SUBTITLE_CLASS}>{subtitle}</Text> : null}
          {body}
        </View>
        {art}
        {showChevron ? <Ionicons name="chevron-forward" size={22} color={foreground} /> : null}
      </View>
    </Card.Body>
  );

  return (
    <Card
      variant="transparent"
      className={[ACCOUNT_PROMO_CARD_CLASS, washClassName].filter(Boolean).join(' ')}
      style={{
        borderRadius: ACCOUNT_CARD_RADIUS,
        backgroundColor: washColor,
        borderWidth: 0,
      }}
    >
      {onPress ? (
        <PressableFeedback
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          onPress={onPress}
        >
          {content}
        </PressableFeedback>
      ) : (
        content
      )}
      {footer ? (
        <Card.Footer style={{ paddingHorizontal: pad, paddingBottom: pad }}>
          {footer}
        </Card.Footer>
      ) : null}
    </Card>
  );
}
