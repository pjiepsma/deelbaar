import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import Account from '~/app/(auth)/account';
import Auth from '~/app/(modals)/auth';
import { useAuth } from '~/lib/AuthProvider';

export default function Profile() {
  const { session, user } = useAuth();

  return (
    <View>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      />
      {user && session ? <Account /> : <Auth />}
    </View>
  );
}
const styles = StyleSheet.create({});
