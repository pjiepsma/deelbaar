import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';
import { payloadClient } from '~/lib/api/PayloadClient';

export default function LoginSettingsScreen() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.email) {
      Alert.alert('Niet ingelogd', 'Log opnieuw in om je wachtwoord te wijzigen.');
      return;
    }
    if (!currentPassword || !newPassword) {
      Alert.alert('Incompleet', 'Vul zowel je huidige als je nieuwe wachtwoord in.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Ongeldig wachtwoord', 'Kies een wachtwoord van minimaal 8 tekens.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Het nieuwe wachtwoord en de herhaling komen niet overeen.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Verifieer het huidige wachtwoord (Payload heeft geen dedicated endpoint, dus we loggen opnieuw in).
      const loginResult = await payloadClient.login(user.email, currentPassword);
      if (loginResult.error) {
        throw new Error('Huidige wachtwoord klopt niet.');
      }

      // 2. Update het wachtwoord via Payload (PATCH op users-collection).
      const { error } = await payloadClient.update('users', user.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      });
      if (error) {
        throw new Error(error.message || 'Kon wachtwoord niet wijzigen.');
      }

      Alert.alert('Gelukt', 'Je wachtwoord is aangepast.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Fout', error.message || 'Er ging iets mis. Probeer opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Inloginstellingen</Text>
        <Text style={styles.description}>
          Wijzig hier je wachtwoord. We vragen eerst om je huidige wachtwoord ter bevestiging.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Huidig wachtwoord</Text>
          <TextInput
            style={styles.input}
            securedTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nieuw wachtwoord</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Minimaal 8 tekens"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bevestig nieuw wachtwoord</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Herhaal nieuwe wachtwoord"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Opslaan…' : 'Opslaan'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4a6c',
  },
  description: {
    color: '#475569',
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});


