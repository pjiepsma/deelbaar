import { Text, View } from 'react-native';

import { BottomSheet, Button } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import { AccountPath } from '../../../navigation/accountPaths';
import { navigateToAccountPath } from '../../../navigation/rootNavigation';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutSheet({ isOpen, onOpenChange }: Props) {
  const { t } = useLocale();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Close />
          <BottomSheet.Title>{t('account.about.title')}</BottomSheet.Title>
          <View style={{ gap: 16 }}>
            <Text className="text-muted text-base">{t('account.about.body')}</Text>
            <Button
              variant="secondary"
              onPress={() => {
                onOpenChange(false);
                navigateToAccountPath(AccountPath.guidelines);
              }}
            >
              <Button.Label>{t('account.about.guidelinesCta')}</Button.Label>
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
