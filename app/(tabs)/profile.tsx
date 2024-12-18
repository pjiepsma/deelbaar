import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import Account from '~/app/(auth)/account';
import Auth from '~/app/(modals)/auth';
import { useAuth } from '~/lib/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { session, user, profile } = useAuth();
  const router = useRouter();
  return (
    <View>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profile',
          headerRight: () =>
            profile?.role === 'Admin' ? (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/admin')}
                style={{ marginRight: 15 }}>
                <Ionicons name="briefcase-outline" size={24} color="#000" />
              </TouchableOpacity>
            ) : null,
        }}
      />
      {user && session ? <Account /> : <Auth />}
    </View>
  );
}
const styles = StyleSheet.create({});
