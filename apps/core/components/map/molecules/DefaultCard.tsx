import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import React from 'react';
import { Text, View } from 'react-native';

interface DefaultCardProps {
  onPress: () => void;
  subtleMessage?: string | null;
}

/**
 * Empty-area listing card — HeroUI Card + Button.
 */
const DefaultCard = React.memo(function DefaultCard({ onPress, subtleMessage }: DefaultCardProps) {
  return (
    <Card className="mx-6 border border-border shadow-md" style={{ height: 170 }}>
      <Card.Body className="flex-1 justify-between gap-2 p-2.5">
        <View className="flex-1 gap-1">
          <Text className="text-xl font-bold text-foreground">Helaas, geen minibiebs in dit gebied.</Text>
          <Text className="text-sm text-muted">Probeer een andere locatie</Text>
          {subtleMessage ? <Text className="mt-2 text-xs leading-4 text-muted">{subtleMessage}</Text> : null}
        </View>
        <Button variant="secondary" className="w-[150px] self-start" onPress={onPress}>
          Expand search
        </Button>
      </Card.Body>
    </Card>
  );
});

DefaultCard.displayName = 'DefaultCard';

export default DefaultCard;
