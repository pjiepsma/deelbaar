import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card } from 'heroui-native';

import { AuthScreenShell } from './AuthScreenShell';
import type { AuthStackParamList } from './auth.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPasswordEmailSent'>;

export function ForgotPasswordEmailSentScreen({ navigation, route }: Props) {
  return (
    <AuthScreenShell title="Check your email" description="If an account exists for this address, reset instructions are on their way.">
      <Card>
        <Card.Body>
          <Card.Description>{route.params.email}</Card.Description>
        </Card.Body>
      </Card>
      <Button variant="primary" onPress={() => navigation.navigate('LoginEmail')}>
        Back to login
      </Button>
      <Button variant="outline" onPress={() => navigation.navigate('ResetPassword')}>
        I already have a reset token
      </Button>
    </AuthScreenShell>
  );
}
