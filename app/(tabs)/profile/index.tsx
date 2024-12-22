import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import Account from '~/app/(tabs)/profile/account';
import Auth from '~/app/(tabs)/profile/auth';
import { useAuth } from '~/lib/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { session, user, profile } = useAuth();
  const router = useRouter();
  return <View>{user && session ? <Account /> : <Auth />}</View>;
}
const styles = StyleSheet.create({});
