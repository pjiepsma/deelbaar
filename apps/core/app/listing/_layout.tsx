import { Stack } from 'expo-router';

import { FULL_BLEED_SCREEN_OPTIONS } from '../../src/navigation/screenOptions';

export default function ListingLayout() {
  return <Stack screenOptions={FULL_BLEED_SCREEN_OPTIONS} />;
}
