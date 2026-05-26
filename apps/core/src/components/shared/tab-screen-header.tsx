import { Text, View } from 'react-native';

import { TAB_SCREEN_TITLE_FONT_SIZE, TAB_SCREEN_TITLE_LINE_HEIGHT } from './tab-screen.constants';

export interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export function TabScreenHeader({ title, subtitle, compact = false }: TabScreenHeaderProps) {
  return (
    <View accessibilityRole="header">
      <Text
        className="font-semibold text-foreground"
        style={{ fontSize: TAB_SCREEN_TITLE_FONT_SIZE, lineHeight: TAB_SCREEN_TITLE_LINE_HEIGHT }}
        maxFontSizeMultiplier={1.4}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className={compact ? 'text-muted mt-1 text-sm leading-5' : 'text-muted mt-2 text-base leading-6'}
          maxFontSizeMultiplier={1.4}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
