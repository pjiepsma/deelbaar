import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';
import { useSystem } from '~/lib/powersync/PowerSync';
import Avatar from '~/components/review/atom/Avatar';
import { useUser } from '~/lib/providers/UserProvider';

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { connector } = useSystem();
  const { signOut, session } = useAuth();
  const { profile } = useUser();

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {profile && <Avatar name={'Admin'} uri={profile.local_uri} size={250} />}
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput value={session?.user?.email} editable={false} style={styles.inputField} />
      </View>
      <View style={styles.verticallySpaced}>
        <TouchableOpacity disabled={!session} onPress={() => signOut()} style={styles.button}>
          <Text style={styles.buttonText}>Sign Out</Text>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  verticallySpaced: {
    marginVertical: 10,
  },
  inputField: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
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
});
