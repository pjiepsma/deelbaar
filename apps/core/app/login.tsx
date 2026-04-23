import React, { useState } from 'react';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Spinner } from 'heroui-native/spinner';
import { Alert, Text, View } from 'react-native';

import { getPayloadSdk, payloadSdkTry } from '~/lib/api/payloadSdk';
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
      const { error } = await payloadSdkTry(() =>
        getPayloadSdk().create({
          collection: 'users',
          data: {
            email,
            password,
            role: 'user',
            isAnonymous: false,
          },
        })
      );

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
    <View className="flex-1 justify-center bg-background px-5">
      {loading ? (
        <View className="absolute inset-0 z-10 items-center justify-center gap-3 bg-black/50">
          <Spinner size="lg" color="default" />
          <Text className="text-lg text-white">Loading…</Text>
        </View>
      ) : null}

      <Text className="mb-8 text-center text-3xl font-bold text-foreground">Deelbaar Login</Text>

      <Card className="mb-4">
        <Card.Body className="gap-3">
          <Input
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="john@doe.com"
            value={email}
            onChangeText={setEmail}
            className="w-full"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="w-full"
          />
        </Card.Body>
      </Card>

      <View className="gap-3">
        <Button onPress={onSignInPress}>Sign in</Button>
        <Button variant="secondary" onPress={onAnonymouslyPress}>
          Anonymously
        </Button>
        <Button variant="outline" onPress={onSignUpPress}>
          Create Account
        </Button>
        <Button variant="tertiary" onPress={onSignOutPress}>
          Sign out
        </Button>
      </View>
    </View>
  );
}
