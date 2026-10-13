import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

import { ACCOUNT_CANVAS_PAD, ACCOUNT_SNAP_CARD_WIDTH } from './accountTheme';

const SNAP_DECK_GAP = 12;

type Props = {
  children: ReactNode;
  cardWidth?: number;
};

export function SnapDeck({ children, cardWidth = ACCOUNT_SNAP_CARD_WIDTH }: Props) {
  return (
    <ScrollView
      horizontal
      snapToInterval={cardWidth + SNAP_DECK_GAP}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: SNAP_DECK_GAP, paddingHorizontal: ACCOUNT_CANVAS_PAD }}
      style={{ marginHorizontal: -ACCOUNT_CANVAS_PAD }}
    >
      {children}
    </ScrollView>
  );
}
