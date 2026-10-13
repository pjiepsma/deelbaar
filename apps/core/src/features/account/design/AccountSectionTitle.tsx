import { Text } from 'react-native';

import { ACCOUNT_TITLE_CLASS } from './accountTheme';

type Props = {
  children: string;
};

/** One title style for guest Account cards + section headers (TB rhythm). */
export function AccountSectionTitle({ children }: Props) {
  return <Text className={ACCOUNT_TITLE_CLASS}>{children}</Text>;
}
