import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet, Button, Card, useThemeColor } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import { useRequireAccountUser } from '../useRequireAccountUser';
import { MetricRing } from '../design/MetricRing';
import { SnapDeck } from '../design/SnapDeck';
import { ACCOUNT_CARD_RADIUS, ACCOUNT_SNAP_CARD_WIDTH } from '../design/accountTheme';
import { Surface } from 'heroui-native';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

type ReachTier = 1 | 2 | 3 | 4;

type PackConfig = {
  tier: ReachTier;
  titleKey: string;
  includedKey: string;
};

const REACH_PACKS: readonly PackConfig[] = [
  { tier: 1, titleKey: 'account.reachStore.packHome', includedKey: 'account.reachStore.included' },
  { tier: 2, titleKey: 'account.reachStore.packProvince', includedKey: 'account.reachStore.notOnSale' },
  { tier: 3, titleKey: 'account.reachStore.packCountry', includedKey: 'account.reachStore.notOnSale' },
  { tier: 4, titleKey: 'account.reachStore.packWorld', includedKey: 'account.reachStore.notOnSale' },
];

function activeReachTier(user: NonNullable<ReturnType<typeof useRequireAccountUser>>): ReachTier {
  const access = user.searchAccess;
  if (access?.world) return 4;
  if (access?.country) return 3;
  if (access?.province) return 2;
  return 1;
}

export function ReachStoreScreen() {
  const user = useRequireAccountUser();
  const { t } = useLocale();
  const accent = useThemeColor('accent');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const ownedTier = user ? activeReachTier(user) : 1;

  const homeLabel = useMemo(() => {
    if (!user) return '';
    return [user.homeArea?.city, user.homeArea?.province, user.homeArea?.country]
      .map((p) => p?.trim())
      .filter((p): p is string => Boolean(p))
      .join(', ');
  }, [user]);

  if (!user) return null;

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountReach} title={t('account.reachStore.title')} subtitle={t('account.reachStore.subtitle')}>
      <Card style={{ borderRadius: ACCOUNT_CARD_RADIUS }}>
        <Card.Body className="flex-row items-center justify-between gap-3">
          <View className="flex-1" style={{ gap: 4 }}>
            <Card.Title>
              {homeLabel.length > 0 ? homeLabel : t('account.homeBase.cityRequired')}
            </Card.Title>
            <Card.Description>{t('account.reachStore.hostingFree')}</Card.Description>
          </View>
          <MetricRing filled={ownedTier} />
        </Card.Body>
      </Card>

      <SnapDeck>
        {REACH_PACKS.map((pack) => (
          <Surface
            key={pack.tier}
            className="bg-surface"
            style={{
              width: ACCOUNT_SNAP_CARD_WIDTH,
              borderRadius: ACCOUNT_CARD_RADIUS,
              padding: 20,
              gap: 8,
              borderWidth: pack.tier === ownedTier ? 2 : 0,
              borderColor: accent,
            }}
          >
            <Text className="text-foreground text-base font-bold">{t(pack.titleKey)}</Text>
            <Text className="text-muted text-sm">{t(pack.includedKey)}</Text>
          </Surface>
        ))}
      </SnapDeck>

      <Button variant="primary" onPress={() => setNotifyOpen(true)}>
        <Button.Label>{t('account.reachStore.notifyCta')}</Button.Label>
      </Button>

      <BottomSheet isOpen={notifyOpen} onOpenChange={setNotifyOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content enableDynamicSizing={false} enableOverDrag={false}>
            <BottomSheet.Close />
            <BottomSheet.Title>{t('account.reachStore.notifyTitle')}</BottomSheet.Title>
            <BottomSheet.Description>{t('account.reachStore.notifyBody')}</BottomSheet.Description>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </AccountTaskScreen>
  );
}
