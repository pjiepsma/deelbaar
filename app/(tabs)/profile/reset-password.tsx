import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '~/constants/Colors';
import { payloadClient } from '~/lib/api/PayloadClient';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Validate token on mount
    if (!token) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Nieuw wachtwoord is verplicht';
    } else if (password.length < 6) {
      newErrors.password = 'Wachtwoord moet minimaal 6 karakters bevatten';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Bevestig je nieuwe wachtwoord';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    if (!token) {
      Alert.alert('Fout', 'Ongeldige reset link. Vraag een nieuwe aan.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: resetError } = await payloadClient.resetPassword(token, password);

      if (resetError) {
        Alert.alert('Fout', resetError.message || 'Er ging iets mis bij het resetten van je wachtwoord.');
        return;
      }

      if (data) {
        Alert.alert(
          'Wachtwoord gewijzigd!',
          'Je wachtwoord is succesvol gewijzigd. Je bent nu ingelogd.',
          [
            {
              text: 'Ga verder',
              onPress: () => {
                // Navigate to main app
                router.replace('/(tabs)/');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Fout', 'Er ging iets mis bij het resetten van je wachtwoord.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(tabs)/profile/auth');
  };

  if (tokenValid === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Ionicons name="close-circle" size={64} color="#ef4444" />
            <Text style={styles.errorTitle}>Ongeldige reset link</Text>
            <Text style={styles.errorText}>
              Deze wachtwoord reset link is ongeldig of verlopen.
              Vraag een nieuwe reset link aan.
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={handleBackToLogin}>
              <Text style={styles.retryText}>Terug naar inloggen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Nieuw wachtwoord instellen</Text>
          <Text style={styles.subtitle}>
            Voer je nieuwe wachtwoord in voor je account.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nieuw wachtwoord</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Minimaal 6 karakters"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bevestig nieuw wachtwoord</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Herhaal je nieuwe wachtwoord"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.resetButton, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>
              {loading ? 'Bezig met opslaan...' : 'Wachtwoord resetten'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securitySection}>
          <Text style={styles.securityTitle}>Veiligheidstip</Text>
          <Text style={styles.securityText}>
            Kies een sterk wachtwoord met minimaal 6 karakters,
            inclusief letters en cijfers.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 32,
  },
  titleContainer: {
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  resetButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  securitySection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  securityText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
