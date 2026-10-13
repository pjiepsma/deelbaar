import { Alert, Text } from 'react-native';

import { Button, Card } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import { useRequireAccountUser } from '../useRequireAccountUser';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

export function DataScreen() {
  const user = useRequireAccountUser();
  const { t } = useLocale();

  if (!user) return null;

  const onDownload = (): void => {
    Alert.alert(t('account.data.downloadTitle'), t('account.data.downloadBody'));
  };

  const onDelete = (): void => {
    Alert.alert(t('account.data.deleteTitle'), t('account.data.deleteBody'), [
      { text: t('account.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountData} title={t('account.data.title')} subtitle={t('account.data.subtitle')}>
      <Card>
        <Card.Body>
          <Card.Title>{t('account.data.storeTitle')}</Card.Title>
          <Card.Description>{t('account.data.storeBody')}</Card.Description>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <Card.Title>{t('account.data.passwordTitle')}</Card.Title>
          <Card.Description>{t('account.data.passwordBody')}</Card.Description>
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <Card.Title>{t('account.data.downloadTitle')}</Card.Title>
          <Card.Description>{t('account.data.downloadBody')}</Card.Description>
        </Card.Body>
      </Card>
      <Button variant="secondary" onPress={onDownload}>
        <Button.Label>{t('account.data.downloadCta')}</Button.Label>
      </Button>
      <Button variant="danger-soft" onPress={onDelete}>
        <Button.Label>{t('account.data.deleteTitle')}</Button.Label>
      </Button>
      <Text className="text-muted text-sm">{t('account.data.honestNote')}</Text>
    </AccountTaskScreen>
  );
}
