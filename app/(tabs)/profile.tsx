import React from 'react';
import { StyleSheet, View } from 'react-native';

import Account from '~/app/(auth)/account';
import Auth from '~/app/(modals)/auth';
import { useAuth } from '~/lib/AuthProvider';

export default function Profile() {
  const { session, user } = useAuth();

  return (
    <View>{user && session ? <Account key={session.user.id} session={session} /> : <Auth />}</View>
  );
}
// <Account key={session.user.id} session={session} />
const styles = StyleSheet.create({});
