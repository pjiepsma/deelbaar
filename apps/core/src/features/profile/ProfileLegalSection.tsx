import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { Fragment } from 'react';
import { View } from 'react-native';

import { ListGroup, Separator, useThemeColor } from 'heroui-native';

import { SectionHeader } from '../../components/shared';
import { useLocale } from '../../context/LocaleContext';
import type { CmsLegalPage } from '../../lib/legal/cmsLegal.types';
import { navigateToLegalDocument } from '../../navigation/rootNavigation';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const LEGAL_ROWS: ReadonlyArray<{ page: CmsLegalPage; labelKey: 'terms' | 'privacy' | 'about'; icon: IoniconName }> =
  [
    { page: 'terms', labelKey: 'terms', icon: 'document-text-outline' },
    { page: 'privacy', labelKey: 'privacy', icon: 'shield-outline' },
    { page: 'about', labelKey: 'about', icon: 'information-circle-outline' },
  ];

export interface ProfileLegalSectionProps {
  compact?: boolean;
}

export function ProfileLegalSection({ compact = false }: ProfileLegalSectionProps) {
  const navigation = useNavigation() as NavigationProp<ParamListBase>;
  const { t } = useLocale();
  const [foreground, muted] = useThemeColor(['foreground', 'muted']);

  const iconSize = compact ? 20 : 22;

  return (
    <View>
      <SectionHeader title={t('profile.legalSectionTitle')} compact={compact} />
      <ListGroup>
        {LEGAL_ROWS.map((row, index) => (
          <Fragment key={row.page}>
            {index > 0 ? <Separator className="mx-4" /> : null}
            <ListGroup.Item onPress={() => navigateToLegalDocument(navigation, { page: row.page })}>
              <ListGroup.ItemPrefix>
                <Ionicons name={row.icon} size={iconSize} color={foreground} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t(`profile.legalRows.${row.labelKey}`)}</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix iconProps={{ size: compact ? 16 : 18, color: muted }} />
            </ListGroup.Item>
          </Fragment>
        ))}
      </ListGroup>
    </View>
  );
}
