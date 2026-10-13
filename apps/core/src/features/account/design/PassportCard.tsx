import { Text, View } from 'react-native';

import { Avatar, Chip, Surface } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import type { AuthUser } from '../../../lib/api/auth/authClient';
import { accountDisplayName, accountInitials } from '../accountDisplayName';
import { ACCOUNT_CARD_RADIUS } from './accountTheme';
import { MetricRing } from './MetricRing';

type Props = {
  user: AuthUser;
  reachTier: 1 | 2 | 3 | 4;
};

function homeLabel(user: AuthUser): string | null {
  const parts = [user.homeArea?.city, user.homeArea?.province, user.homeArea?.country]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(', ') : null;
}

export function PassportCard({ user, reachTier }: Props) {
  const { t } = useLocale();
  const displayName = accountDisplayName(user);
  const initials = accountInitials(user);
  const home = homeLabel(user);
  const verified = user._verified === true;

  return (
    <Surface className="bg-surface" style={{ borderRadius: ACCOUNT_CARD_RADIUS, padding: 20 }}>
      <View className="flex-row items-center" style={{ gap: 16 }}>
        <View className="flex-1" style={{ gap: 6 }}>
          <Avatar size="lg">
            <Avatar.Fallback className="bg-accent/20">
              <Text className="text-accent font-bold text-sm">{initials}</Text>
            </Avatar.Fallback>
          </Avatar>
          <Text
            className="text-foreground font-bold"
            style={{ fontSize: 18, lineHeight: 24, marginTop: 8 }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text className="text-muted text-sm" numberOfLines={1}>
            {home ?? t('account.passport.homeUnset')}
          </Text>
          <View style={{ marginTop: 4 }}>
            <Chip variant={verified ? 'primary' : 'secondary'} size="sm">
              <Chip.Label>
                {verified ? t('account.passport.verified') : t('account.passport.unverified')}
              </Chip.Label>
            </Chip>
          </View>
        </View>
        <MetricRing filled={reachTier} />
      </View>
    </Surface>
  );
}
