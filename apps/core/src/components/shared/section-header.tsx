import { Text } from 'react-native';

import { TAB_SCREEN_SECTION_TITLE_FONT_SIZE } from './tab-screen.constants';

export interface SectionHeaderProps {
  title: string;
  compact?: boolean;
}

export function SectionHeader({ title, compact = false }: SectionHeaderProps) {
  return (
    <Text
      className={compact ? 'mb-1 font-bold text-foreground' : 'mb-2 font-bold text-foreground'}
      style={{
        fontSize: compact ? 18 : TAB_SCREEN_SECTION_TITLE_FONT_SIZE,
      }}
      maxFontSizeMultiplier={1.4}
    >
      {title}
    </Text>
  );
}
