import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST_ATTESTATION_KEY_PREFIX = 'account_host_attestation_v1:';

function keyForUser(userId: string | number): string {
  return `${HOST_ATTESTATION_KEY_PREFIX}${String(userId)}`;
}

export async function getHostAttestationComplete(userId: string | number): Promise<boolean> {
  const value = await AsyncStorage.getItem(keyForUser(userId));
  return value === '1';
}

export async function setHostAttestationComplete(userId: string | number): Promise<void> {
  await AsyncStorage.setItem(keyForUser(userId), '1');
}
