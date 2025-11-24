import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import StepContainer from '~/components/StepContainer';
import Colors from '~/constants/Colors';
import { payloadClient } from '~/lib/api/PayloadClient';
import { useAuth } from '~/lib/providers/AuthProvider';

export default function Step1Account() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is verplicht';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Voer een geldig emailadres in';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Wachtwoord is verplicht';
    } else if (password.length < 6) {
      newErrors.password = 'Wachtwoord moet minimaal 6 karakters bevatten';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Bevestig je wachtwoord';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Register the account - Payload will automatically send verification email
      const { data: registerData, error: registerError } = await payloadClient.register(email, password);
      if (registerError) {
        Alert.alert('Registratie mislukt', registerError.message || 'Er ging iets mis bij het registreren.');
        return;
      }

      // Proceed to email verification step
      router.push({
        pathname: '/(tabs)/profile/register/step2-verify-email',
        params: {
          email,
          password,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Fout', 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    'Account aanmaken',
    'Email verifiëren',
    'Adresgegevens',
    'Profiel instellen'
  ];

  return (
    <StepContainer
      title="Account aanmaken"
      subtitle="Maak een account aan om deel te nemen aan de Deelbaar community"
      currentStep={1}
      totalSteps={4}
      stepLabels={stepLabels}
      nextButton={{
        title: 'Verder',
        onPress: handleNext,
        loading,
        disabled: loading,
      }}
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emailadres</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="jouw@email.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Wachtwoord</Text>
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
          <Text style={styles.label}>Bevestig wachtwoord</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="Herhaal je wachtwoord"
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
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
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
});
