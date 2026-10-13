import { Chip, Surface } from 'heroui-native';
import { View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import { TestId } from '../../testing/testIds';

type Props = {
  count: number;
  isFetching: boolean;
};

export function MapResultCount({ count, isFetching }: Props) {
  const { t } = useLocale();

  let label: string;
  if (isFetching && count === 0) {
    label = t('map.countLoading');
  } else if (count === 0) {
    label = t('map.countEmpty');
  } else if (count === 1) {
    label = t('map.countSingle', { count: '1' });
  } else {
    label = t('map.countPlural', { count: String(count) });
  }

  return (
    <View testID={TestId.mapResultCount} className="self-start">
      <Surface variant="default" className="rounded-full px-0.5 py-0.5">
        <Chip size="md" variant="secondary" background={null}>
          <Chip.Label>{label}</Chip.Label>
        </Chip>
      </Surface>
    </View>
  );
}
