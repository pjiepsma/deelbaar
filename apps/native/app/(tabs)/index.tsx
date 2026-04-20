import { Button } from 'heroui-native/button';
import { View } from 'react-native';

/**
 * HeroUI Native quick start — https://www.heroui.com/docs/native/getting-started/quick-start
 */
export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Button onPress={() => console.log('Pressed!')}>Get Started</Button>
    </View>
  );
}
