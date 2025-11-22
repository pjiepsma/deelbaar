import { ActivityIndicator, StyleSheet, View } from 'react-native';

import AccountScreen from './account';
import AuthScreen from './auth';

import { useAuth } from '~/lib/providers/AuthProvider';

export default function ProfileTab() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  return user ? <AccountScreen /> : <AuthScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
