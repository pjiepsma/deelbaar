import AsyncStorage from '@react-native-async-storage/async-storage';

export const AsyncStorageConnector = {
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to save data to AsyncStorage:', error);
    }
  },
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null ? value : null;
    } catch (error) {
      console.error('Failed to fetch data from AsyncStorage:', error);
      return null;
    }
  },
  deleteItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete data from AsyncStorage:', error);
    }
  },
};
