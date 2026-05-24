import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPLORE_KEY = 'map_coachmark_explore_v1';
const CARDS_KEY = 'map_coachmark_cards_v1';
const ACTIVATION_KEY = 'map_coachmark_activation_v1';

export async function getMapCoachmarkExploreDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(EXPLORE_KEY)) === '1';
}

export async function setMapCoachmarkExploreDone(): Promise<void> {
  await AsyncStorage.setItem(EXPLORE_KEY, '1');
}

export async function getMapCoachmarkCardsDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(CARDS_KEY)) === '1';
}

export async function setMapCoachmarkCardsDone(): Promise<void> {
  await AsyncStorage.setItem(CARDS_KEY, '1');
}

export async function getMapCoachmarkActivationDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(ACTIVATION_KEY)) === '1';
}

export async function setMapCoachmarkActivationDone(): Promise<void> {
  await AsyncStorage.setItem(ACTIVATION_KEY, '1');
}
