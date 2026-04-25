import { Card } from 'heroui-native';
import { View } from 'react-native';

const SCREEN_PADDING = 16;

export function SavedScreen() {
  return (
    <View style={{ flex: 1, padding: SCREEN_PADDING }}>
      <Card>
        <Card.Body>
          <Card.Title>Saved listings</Card.Title>
          <Card.Description>Followed and favorite listings will appear here.</Card.Description>
        </Card.Body>
      </Card>
    </View>
  );
}
