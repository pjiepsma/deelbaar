import { View } from 'react-native';

import BareMapboxMap from '~/components/map/organisms/BareMapboxMap';

export default function MapTabScreen() {
  return (
    <View className="flex-1">
      <BareMapboxMap />
    </View>
  );
}
