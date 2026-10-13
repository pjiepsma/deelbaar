import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Card } from 'heroui-native';
import { SlideButton } from 'heroui-native-pro/slide-button';

import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';
import { getHostAttestationComplete, setHostAttestationComplete } from '../hostAttestation.storage';
import { ACCOUNT_CARD_RADIUS } from '../design/accountTheme';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

const RULE_KEYS = ['s1', 's2', 's3'] as const;

export function RulesScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [attested, setAttested] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getHostAttestationComplete(user.id).then(setAttested);
  }, [user]);

  const onAttest = async (): Promise<void> => {
    if (!user) return;
    setSaving(true);
    try {
      await setHostAttestationComplete(user.id);
      setAttested(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountRules} title={t('account.rules.title')} subtitle={t('account.rules.subtitle')}>
      {RULE_KEYS.map((key, index) => (
        <Card key={key} variant="secondary" style={{ borderRadius: ACCOUNT_CARD_RADIUS }}>
          <Card.Body className="flex-row gap-3">
            <Text className="text-accent font-bold">{index + 1}.</Text>
            <Text className="text-foreground flex-1 text-base">{t(`account.rules.${key}`)}</Text>
          </Card.Body>
        </Card>
      ))}

      {user ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          {attested ? (
            <Text className="text-success text-base">{t('account.rules.attested')}</Text>
          ) : (
            <SlideButton variant="accent" onComplete={() => void onAttest()} isDisabled={saving}>
              <SlideButton.UnderlayContent>
                <SlideButton.Label>{t('account.rules.slideLabel')}</SlideButton.Label>
              </SlideButton.UnderlayContent>
              <SlideButton.OverlayContent className="bg-accent">
                <SlideButton.Label className="text-accent-foreground">
                  {t('account.rules.attesting')}
                </SlideButton.Label>
              </SlideButton.OverlayContent>
              <SlideButton.Thumb />
            </SlideButton>
          )}
          <Text className="text-muted text-sm">{t('account.rules.attestHint')}</Text>
        </View>
      ) : (
        <Text className="text-muted text-sm">{t('account.rules.guestHint')}</Text>
      )}
    </AccountTaskScreen>
  );
}
