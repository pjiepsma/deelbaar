import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StepContainer from '~/components/StepContainer';
import Colors from '~/constants/Colors';
import { payloadClient } from '~/lib/api/PayloadClient';

export default function Step4Profile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const password = params.password as string;
  const addressString = params.address as string;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameValid, setUsernameValid] = useState(false);

  // Parse address from params
  const address = addressString ? JSON.parse(addressString) : {};

  const validateUsername = async (value: string) => {
    if (!value.trim()) {
      setUsernameError(null);
      setUsernameValid(false);
      return;
    }

    // Basic validation
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value)) {
      setUsernameError('Gebruikersnaam mag alleen letters, cijfers, - en _ bevatten');
      setUsernameValid(false);
      return;
    }

    if (value.length < 3) {
      setUsernameError('Gebruikersnaam moet minimaal 3 karakters bevatten');
      setUsernameValid(false);
      return;
    }

    // Check uniqueness
    setCheckingUsername(true);
    try {
      const { data } = await payloadClient.findMany('users', {
        where: {
          username: {
            equals: value,
          },
        },
      });

      if (data && data.docs.length > 0) {
        setUsernameError('Deze gebruikersnaam is al in gebruik');
        setUsernameValid(false);
      } else {
        setUsernameError(null);
        setUsernameValid(true);
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameError('Kon gebruikersnaam niet controleren');
      setUsernameValid(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError(null);
    setUsernameValid(false);

    // Debounce username validation
    const timeoutId = setTimeout(() => {
      validateUsername(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const completeRegistration = async (profileData?: any) => {
    setLoading(true);
    try {
      // Update user profile with additional data
      const updateData = {
        name: firstName.trim() || undefined,
        surname: lastName.trim() || undefined,
        username: username.trim() || undefined,
        address,
        ...profileData,
      };

      // Since the user is already created and verified, we need to update their profile
      // First get the current user, then update
      const { data: userData } = await payloadClient.me();
      if (userData) {
        await payloadClient.update('users', userData.id, updateData);
      }

      // Show success and navigate to main app
      Alert.alert(
        'Account voltooid!',
        'Je account is succesvol aangemaakt. Welkom bij Deelbaar!',
        [
          {
            text: 'Ga verder',
            onPress: () => {
              // Navigate to main app - this will be handled by the auth state change
              router.replace('/(tabs)/');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Fout', 'Er ging iets mis bij het voltooien van je profiel. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWithProfile = async () => {
    if (username && !usernameValid) {
      Alert.alert('Ongeldige gebruikersnaam', 'Controleer je gebruikersnaam voordat je verder gaat.');
      return;
    }

    await completeRegistration({
      name: firstName.trim() || undefined,
      surname: lastName.trim() || undefined,
      username: username.trim() || undefined,
    });
  };

  const handleSkipProfile = async () => {
    Alert.alert(
      'Profiel overslaan',
      'Je kunt je profiel later altijd nog invullen in de instellingen.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Overslaan',
          onPress: () => completeRegistration(),
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const stepLabels = [
    'Account aanmaken',
    'Email verifiëren',
    'Adresgegevens',
    'Profiel instellen'
  ];

  const canComplete = !checkingUsername && (!username || usernameValid);

  return (
    <StepContainer
      title="Profiel instellen"
      subtitle="Deze informatie is optioneel en kan later worden aangepast"
      currentStep={4}
      totalSteps={4}
      stepLabels={stepLabels}
      onBack={handleBack}
      nextButton={{
        title: 'Account voltooien',
        onPress: handleCompleteWithProfile,
        loading,
        disabled: loading || !canComplete,
      }}
    >
      <View style={styles.form}>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.nameInput]}>
            <Text style={styles.label}>Voornaam</Text>
            <TextInput
              style={styles.input}
              placeholder="Jan"
              placeholderTextColor="#9ca3af"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputGroup, styles.nameInput]}>
            <Text style={styles.label}>Achternaam</Text>
            <TextInput
              style={styles.input}
              placeholder="Jansen"
              placeholderTextColor="#9ca3af"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gebruikersnaam (optioneel)</Text>
          <View style={styles.usernameContainer}>
            <TextInput
              style={[styles.input, styles.usernameInput]}
              placeholder="janjansen"
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !checkingUsername}
            />
            {checkingUsername && (
              <View style={styles.usernameStatus}>
                <Ionicons name="ellipsis-horizontal" size={16} color="#6b7280" />
              </View>
            )}
            {!checkingUsername && username && (
              <View style={styles.usernameStatus}>
                <Ionicons
                  name={usernameValid ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={usernameValid ? "#10b981" : "#ef4444"}
                />
              </View>
            )}
          </View>
          {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
          <Text style={styles.helperText}>
            Unieke gebruikersnaam voor je profiel
          </Text>
        </View>

        <View style={styles.skipSection}>
          <TouchableOpacity
            style={[styles.skipButton, loading && styles.buttonDisabled]}
            onPress={handleSkipProfile}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Profiel later instellen</Text>
          </TouchableOpacity>
          <Text style={styles.skipHelperText}>
            Je account wordt dan alsnog voltooid
          </Text>
        </View>
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  nameInput: {
    flex: 1,
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
  usernameContainer: {
    position: 'relative',
  },
  usernameInput: {
    paddingRight: 40,
  },
  usernameStatus: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  helperText: {
    color: '#6b7280',
    fontSize: 14,
  },
  skipSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  skipHelperText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
});









