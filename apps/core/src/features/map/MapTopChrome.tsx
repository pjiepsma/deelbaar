import type { ReactNode } from 'react';
import { View } from 'react-native';

import { TestId } from '../../testing/testIds';

type Props = {
  children: ReactNode;
};

/** Top map stack: search + tabs + count — no wrapping card (map stays hero). */
export function MapTopChrome({ children }: Props) {
  return (
    <View testID={TestId.mapTopChrome} className="gap-2">
      {children}
    </View>
  );
}
