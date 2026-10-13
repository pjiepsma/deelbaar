import { Text, View } from 'react-native';

import { Chip, PressableFeedback, Surface } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import type { AuthUser } from '../../../lib/api/auth/authClient';
import { AccountPath } from '../../../navigation/accountPaths';
import { navigateToAccountPath } from '../../../navigation/rootNavigation';
import type { MapPlaceRecord } from '../../map/map.types';
import { SnapDeck } from '../design/SnapDeck';
import { ACCOUNT_CARD_RADIUS, ACCOUNT_SNAP_CARD_WIDTH } from '../design/accountTheme';

type Props = {
  user: AuthUser;
  listings: MapPlaceRecord[] | null;
  attested: boolean;
};

type ActionCard = {
  key: string;
  label: string;
  onPress: () => void;
};

function buildCards(user: AuthUser, listings: MapPlaceRecord[] | null, attested: boolean, t: (k: string, v?: Record<string, string>) => string): ActionCard[] {
  const cards: ActionCard[] = [];

  if (user._verified !== true) {
    cards.push({
      key: 'verify-email',
      label: t('account.deck.verifyEmail'),
      onPress: () => navigateToAccountPath(AccountPath.profile),
    });
  }

  if (!user.homeArea?.city) {
    cards.push({
      key: 'set-home',
      label: t('account.deck.setHome'),
      onPress: () => navigateToAccountPath(AccountPath.homeArea),
    });
  }

  if (listings) {
    const newestDraft = listings.find((l) => l.publishStatus === 'draft');

    if (newestDraft) {
      cards.push({
        key: 'finish-draft',
        label: t('account.deck.finishDraft', { name: newestDraft.name }),
        onPress: () => navigateToAccountPath(AccountPath.listings),
      });
    }
  }

  if (!attested) {
    cards.push({
      key: 'attest',
      label: t('account.deck.attest'),
      onPress: () => navigateToAccountPath(AccountPath.guidelines),
    });
  }

  return cards;
}

export function AccountActionDeck({ user, listings, attested }: Props) {
  const { t } = useLocale();
  const cards = buildCards(user, listings, attested, t);

  if (cards.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      <Text className="text-muted text-xs font-semibold uppercase tracking-wide">
        {t('account.console.nextSteps')}
      </Text>
      <SnapDeck>
        {cards.map((card) => (
          <PressableFeedback key={card.key} onPress={card.onPress} accessibilityLabel={card.label}>
            <Surface
              className="bg-accent/10"
              style={{
                borderRadius: ACCOUNT_CARD_RADIUS,
                padding: 16,
                width: ACCOUNT_SNAP_CARD_WIDTH,
                gap: 8,
                justifyContent: 'center',
                minHeight: 80,
              }}
            >
              <Text className="text-foreground text-sm font-medium" numberOfLines={2}>
                {card.label}
              </Text>
              <Chip variant="primary" size="sm" className="self-start">
                <Chip.Label>→</Chip.Label>
              </Chip>
            </Surface>
          </PressableFeedback>
        ))}
      </SnapDeck>
    </View>
  );
}
