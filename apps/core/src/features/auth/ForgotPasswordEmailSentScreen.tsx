import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card } from 'heroui-native';

import { useLocale } from '../../context/LocaleContext';
import { AuthScreenShell } from '../../components/shared';
import type { AuthStackParamList } from './auth.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPasswordEmailSent'>;

export function ForgotPasswordEmailSentScreen({ navigation, route }: Props) {
  const { t } = useLocale();

  return (
    <AuthScreenShell title={t('auth.checkYourEmailTitle')} description={t('auth.checkYourEmailDescription')}>
      <Card>
        <Card.Body>
          <Card.Description>{route.params.email}</Card.Description>
        </Card.Body>
      </Card>
      <Button variant="primary" onPress={() => navigation.navigate('LoginEmail')}>
        {t('auth.backToLogin')}
      </Button>
      <Button variant="outline" onPress={() => navigation.navigate('ResetPassword')}>
        {t('auth.haveResetToken')}
      </Button>
    </AuthScreenShell>
  );
}
