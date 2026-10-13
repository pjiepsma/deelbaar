import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import { HeroChromeButton } from '../../listings/HeroChromeButton';
import { TestId } from '../../../testing/testIds';
import { ACCOUNT_CANVAS_PAD } from '../design/accountTheme';

const TOP_CHROME_PAD = 8;
const BODY_BOTTOM_PAD = 24;
const STICKY_RESERVE = 96;

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  stickyBottom?: ReactNode;
  testID?: string;
};

export function AccountTaskScreen({
  title,
  subtitle,
  children,
  scroll = true,
  stickyBottom,
  testID,
}: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor('foreground');
  const stickyReserve = stickyBottom ? STICKY_RESERVE : 16;
  const contentBottom = Math.max(insets.bottom, BODY_BOTTOM_PAD) + stickyReserve;

  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: ACCOUNT_CANVAS_PAD,
        paddingBottom: contentBottom,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      className="flex-1"
      style={{
        paddingHorizontal: ACCOUNT_CANVAS_PAD,
        paddingBottom: contentBottom,
        gap: 16,
      }}
    >
      {children}
    </View>
  );

  return (
    <View testID={testID} className="flex-1 bg-background">
      <View
        style={{
          paddingTop: insets.top + TOP_CHROME_PAD,
          paddingHorizontal: ACCOUNT_CANVAS_PAD,
          paddingBottom: 12,
        }}
      >
        <View className="flex-row items-start" style={{ gap: 12 }}>
          <HeroChromeButton
            testID={TestId.btnBack}
            onPress={() => router.back()}
            accessibilityLabel={t('account.back')}
          >
            <Ionicons name="arrow-back" size={22} color={foreground} />
          </HeroChromeButton>
          <View className="min-w-0 flex-1" style={{ gap: 2, paddingTop: 6 }}>
            <Text className="text-foreground text-xl font-bold leading-7" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-muted text-sm leading-5">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {body}
      {stickyBottom ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom,
            paddingHorizontal: ACCOUNT_CANVAS_PAD,
          }}
        >
          {stickyBottom}
        </View>
      ) : null}
    </View>
  );
}
