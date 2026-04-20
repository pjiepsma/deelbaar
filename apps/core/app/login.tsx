import React, { useState } from 'react';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { payloadClient } from '~/lib/api/PayloadClient';
import { useAuth } from '~/lib/providers/AuthProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInAnonymously, signOut } = useAuth();

  const onSignInPress = async () => {
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) Alert.alert('Login Failed', error.message);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAnonymouslyPress = async () => {
    setLoading(true);
    try {
      const { error } = await signInAnonymously();
      if (error) Alert.alert('Anonymous Login Failed', error.message);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSignOutPress = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSignUpPress = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await payloadClient.create('users', {
        email,
        password,
        role: 'user',
        isAnonymous: false,
      });

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert('Success', 'Account created! Please sign in.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      <Text style={styles.header}>Deelbaar Login</Text>

      <Input
        autoCapitalize="none"
        placeholder="john@doe.com"
        value={email}
        onChangeText={setEmail}
        style={styles.inputField}
      />
      <Input
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.inputField}
      />

      <Button onPress={onSignInPress} className="mt-4">
        Sign in
      </Button>
      <Button variant="secondary" onPress={onAnonymouslyPress} className="mt-3">
        Anonymously
      </Button>
      <Button variant="outline" onPress={onSignUpPress} className="mt-3">
        Create Account
      </Button>
      <Button variant="tertiary" onPress={onSignOutPress} className="mt-3">
        Sign out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
    padding: 20,
    backgroundColor: '#151515',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 10,
  },
  loadingText: { color: '#fff', fontSize: 20 },
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
});
