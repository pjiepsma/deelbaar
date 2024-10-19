import React from 'react';
import { StyleSheet, View } from 'react-native';

import Account from '~/app/(auth)/account';
import Auth from '~/app/(modals)/auth';
import { useAuth } from '~/lib/AuthProvider';

export default function Profile() {
  const { session, user, isAnonymous } = useAuth();
  const hasProfile = session && user && !isAnonymous;
  return <View>{hasProfile ? <Account key={session.user.id} session={session} /> : <Auth />}</View>;
}

const styles = StyleSheet.create({});
