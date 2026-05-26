import { Card } from 'heroui-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';

import { PLACE_DETAIL_HORIZONTAL_PADDING } from '../../features/listings/placeDetail.constants';
import { ScreenBackChrome } from './screen-back-chrome';

type AuthScreenShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  footer?: ReactNode;
  layout?: 'default' | 'centered';
  leading?: ReactNode;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  titlePresentation?: 'card' | 'plain';
  titleAlign?: 'center' | 'left';
}>;

export function AuthScreenShell({
  title,
  description,
  footer,
  children,
  layout = 'default',
  leading,
  onBack,
  backAccessibilityLabel = 'Back',
  titlePresentation = 'card',
  titleAlign = 'left',
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();
  const isCentered = layout === 'centered';
  const columnGapClass = titlePresentation === 'plain' ? 'gap-0' : 'gap-4';
  const centeredColumnWidth = isCentered ? 'w-full max-w-[420px] self-center' : 'w-full';

  const footerPaddingBottom = Math.max(insets.bottom, 20);
  const footerBottomOffset = footer ? footerPaddingBottom : 0;
  const scrollPaddingTop = onBack ? 0 : Math.max(insets.top, 12);

  return (
    <View className="flex-1 bg-background">
      {onBack ? (
        <ScreenBackChrome onBack={onBack} accessibilityLabel={backAccessibilityLabel} />
      ) : null}
      <KeyboardAwareScrollView
        className="flex-1"
        bottomOffset={footerBottomOffset}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isCentered ? 'center' : 'flex-start',
          paddingTop: scrollPaddingTop,
          paddingBottom: footer ? 0 : footerPaddingBottom,
        }}
      >
        <View
          className={twMerge(centeredColumnWidth, columnGapClass)}
          style={{ paddingHorizontal: PLACE_DETAIL_HORIZONTAL_PADDING }}
        >
          {leading}
          {titlePresentation === 'plain' ? (
            <Text
              className={twMerge(
                'font-bold text-[26px] text-foreground',
                titleAlign === 'center' ? 'text-center' : 'text-left',
                leading ? '' : 'mb-5',
              )}
            >
              {title}
            </Text>
          ) : (
            <Card>
              <Card.Body>
                <Card.Title>{title}</Card.Title>
                {description ? <Card.Description>{description}</Card.Description> : null}
              </Card.Body>
            </Card>
          )}
          {children}
        </View>
      </KeyboardAwareScrollView>
      {footer ? (
        <View style={{ paddingHorizontal: PLACE_DETAIL_HORIZONTAL_PADDING, paddingBottom: footerPaddingBottom }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
