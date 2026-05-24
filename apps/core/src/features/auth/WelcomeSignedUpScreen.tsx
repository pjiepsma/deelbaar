import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card } from 'heroui-native';
import { View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import type { AuthStackParamList } from './auth.types';
import { AuthScreenShell } from './AuthScreenShell';

type Props = NativeStackScreenProps<AuthStackParamList, 'WelcomeSignedUp'>;

export function WelcomeSignedUpScreen({ navigation }: Props) {
  const { t } = useLocale();

  const goNext = (): void => {
    navigation.navigate('SignUpNotifications', { source: 'signup' });
  };

  return (
    <AuthScreenShell title={t('auth.welcomeTitle')} description={t('auth.welcomeDescription')}>
      <Card>
        <Card.Body>
          <Card.Description>{t('auth.deviceSettingsFootnote')}</Card.Description>
        </Card.Body>
      </Card>

      <View style={{ gap: 10 }}>
        <Button variant="primary" onPress={goNext}>
          {t('auth.welcomeContinue')}
        </Button>
        <Button variant="outline" onPress={goNext}>
          {t('auth.welcomeSkip')}
        </Button>
      </View>
    </AuthScreenShell>
  );
}
