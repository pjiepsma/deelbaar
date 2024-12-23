import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '~/lib/AuthProvider';
import { useSystem } from '~/lib/powersync/System';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { connector, powersync } = useSystem();
  const { signIn } = useAuth();
  // Sign in with email and password
  const onSignInPress = async () => {
    setLoading(true);
    try {
      // Use the PowerSync specific login method
      const data = await connector.login(email, password);
      signIn(data);
    } catch (error: any) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAnonymouslyPress = async () => {
    setLoading(true);
    try {
      // Use the PowerSync specific login method
      const data = await connector.anonymously();
      signIn(data);
    } catch (error: any) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSignOutPress = async () => {
    setLoading(true);
    try {
      await powersync.disconnectAndClear();
      await connector.client.auth.signOut();
    } catch (error: any) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new user
  const onSignUpPress = async () => {
    setLoading(true);

    const {
      data: { session },
      error,
    } = await connector.client.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert(error.message);
    } else if (!session) {
      Alert.alert('Please check your inbox for email verification!');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            elevation: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            gap: 10,
          }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', fontSize: 20 }}>Loading...</Text>
        </View>
      )}

      <Text style={styles.header}>Power Todos 2</Text>

      <TextInput
        autoCapitalize="none"
        placeholder="john@doe.com"
        value={email}
        onChangeText={setEmail}
        style={styles.inputField}
      />
      <TextInput
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.inputField}
      />

      <TouchableOpacity onPress={onSignInPress} style={styles.button}>
        <Text style={{ color: '#fff' }}>Sign in</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAnonymouslyPress} style={styles.button}>
        <Text style={{ color: '#fff' }}>Anonymously</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSignUpPress} style={styles.button}>
        <Text style={{ color: '#fff' }}>Create Account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSignOutPress} style={styles.button}>
        <Text style={{ color: '#fff' }}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
    padding: 20,
    backgroundColor: '#151515',
  },
  header: {
    fontSize: 30,
    textAlign: 'center',
    margin: 50,
    color: '#fff',
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: '#A700FF',
    borderRadius: 4,
    padding: 10,
    color: '#fff',
    backgroundColor: '#363636',
  },
  button: {
    marginVertical: 15,
    alignItems: 'center',
    backgroundColor: '#A700FF',
    padding: 12,
    borderRadius: 4,
  },
});

export default Login;
