import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';

export default function AuthScreen() {
  const { signIn, signInAnonymously } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const withStatus = async (action: () => Promise<{ error?: { message: string } }>) => {
    setLoading(true);
    setStatus(null);
    const result = await action();
    if (result.error) {
      setStatus(result.error.message);
    } else {
      setStatus('Ingelogd!');
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in om verder te gaan</Text>
      <TextInput
        placeholder="email@adres.com"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        editable={!loading}
      />
      <TextInput
        placeholder="Wachtwoord (optioneel)"
        placeholderTextColor="#999"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={() => withStatus(() => signIn(email, password))}>
        <Text style={styles.buttonText}>{loading ? 'Bezig...' : 'Inloggen'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={() => withStatus(() => signInAnonymously())}>
        <Text style={styles.secondaryButtonText}>Ga verder als gast</Text>
      </TouchableOpacity>

      <View style={styles.helperBox}>
        <Text style={styles.helperTitle}>Hoe werkt dit?</Text>
        <Text style={styles.helperParagraph}>
          In deze pure Expo setup gebruiken we een eenvoudige lokale login. Bij het overzetten van de legacy-app kun je
          deze flow vervangen door de echte Payload-authenticatie.
        </Text>
      </View>

      {status && <Text style={styles.statusMessage}>{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  helperBox: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  helperTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
  },
  helperParagraph: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  statusMessage: {
    marginTop: 12,
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: '500',
  },
});


