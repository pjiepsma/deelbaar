import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/AuthProvider';
import { useSystem } from '~/lib/powersync/System';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { connector } = useSystem();
  const { user, signIn, signOut } = useAuth();

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Email and password must be provided: ' + email + ' ' + password);
      return;
    }

    setLoading(true);
    const {
      data: { session, user },
      error,
    } = await connector.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(error.message);
    } else {
      signIn({ session, user });
    }

    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await connector.client.auth.signUp({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.verticallySpaced}>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>
      <TouchableOpacity disabled={loading} onPress={signInWithEmail} style={styles.button}>
        <Text style={styles.buttonText}>Sign in</Text>
      </TouchableOpacity>
      <View style={styles.footerText}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={signUpWithEmail}>
          <Text style={styles.link}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  verticallySpaced: {
    marginVertical: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
