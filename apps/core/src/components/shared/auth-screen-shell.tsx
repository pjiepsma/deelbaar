import { Card } from 'heroui-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';

type AuthScreenShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  footer?: ReactNode;
  layout?: 'default' | 'centered';
  leading?: ReactNode;
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
  titlePresentation = 'card',
  titleAlign = 'left',
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();
  const isCentered = layout === 'centered';
  const columnGapClass = titlePresentation === 'plain' ? 'gap-0' : 'gap-4';
  const centeredColumnWidth = isCentered ? 'w-full max-w-[420px] self-center' : 'w-full';

  const paddingTop = Math.max(insets.top, 12);
  const footerPaddingBottom = Math.max(insets.bottom, 20);
  const footerBottomOffset = footer ? footerPaddingBottom : 0;

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        className="flex-1"
        bottomOffset={footerBottomOffset}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isCentered ? 'center' : 'flex-start',
          paddingTop,
          paddingBottom: footer ? 0 : footerPaddingBottom,
        }}
      >
        <View className={twMerge('px-5', centeredColumnWidth, columnGapClass)}>
          {leading}
          {titlePresentation === 'plain' ? (
            <Text
              className={twMerge(
                'mb-5 font-bold text-[26px] text-foreground',
                titleAlign === 'center' ? 'text-center' : 'text-left',
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
        <View className="px-5" style={{ paddingBottom: footerPaddingBottom }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
