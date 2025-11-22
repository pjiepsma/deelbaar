import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import RegistrationSuccessModal from '~/components/RegistrationSuccessModal';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/providers/AuthProvider';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const { signIn, signUp, signInAnonymously } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const withStatus = async (action: () => Promise<{ error?: { message: string } }>) => {
    setLoading(true);
    setStatus(null);
    const result = await action();
    if (result.error) {
      setStatus(result.error.message);
    } else {
      if (mode === 'register') {
        // Show success modal for registration
        setShowSuccessModal(true);
      } else {
        setStatus('Ingelogd!');
        setEmail('');
        setPassword('');
      }
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    if (mode === 'register') {
      if (password !== confirmPassword) {
        setStatus('Wachtwoorden komen niet overeen');
        return;
      }
      if (password.length < 6) {
        setStatus('Wachtwoord moet minimaal 6 karakters bevatten');
        return;
      }
      if (!street.trim() || !houseNumber.trim() || !postalCode.trim() || !city.trim()) {
        setStatus('Vul je volledige adres in om je account te registreren.');
        return;
      }
      await withStatus(() =>
        signUp(email, password, {
          address: {
            street: street.trim(),
            houseNumber: houseNumber.trim(),
            postalCode: postalCode.trim(),
            city: city.trim(),
          },
          preferredLanguage: 'nl',
        })
      );
    } else {
      await withStatus(() => signIn(email, password));
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setStatus(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStreet('');
    setHouseNumber('');
    setPostalCode('');
    setCity('');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStreet('');
    setHouseNumber('');
    setPostalCode('');
    setCity('');
  };

  const fillAddressFromLocation = async () => {
    if (loading || isFetchingAddress) return;

    try {
      setIsFetchingAddress(true);
      setStatus(null);

      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== Location.PermissionStatus.GRANTED) {
        setStatus('Locatietoegang geweigerd. Vul je adres handmatig in.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync(position.coords);
      const [geo] = geocode;

      if (!geo) {
        setStatus('Kon je adres niet bepalen. Vul het handmatig in.');
        return;
      }

      const streetName = geo.street || geo.name || '';
      const derivedHouseNumber =
        geo.streetNumber ||
        (geo.name && streetName ? geo.name.replace(streetName, '').trim() : '') ||
        geo.name ||
        '';

      setStreet(streetName);
      setHouseNumber(derivedHouseNumber.trim());
      setPostalCode(geo.postalCode || '');
      setCity(geo.city || geo.subregion || geo.region || '');
    } catch (error) {
      console.warn('fillAddressFromLocation error', error);
      setStatus('Er ging iets mis bij het ophalen van je adres.');
    } finally {
      setIsFetchingAddress(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'login' ? 'Log in om verder te gaan' : 'Maak een account aan'}
      </Text>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
          onPress={() => setMode('login')}>
          <Text style={[styles.modeButtonText, mode === 'login' && styles.modeButtonTextActive]}>
            Inloggen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
          onPress={() => setMode('register')}>
          <Text style={[styles.modeButtonText, mode === 'register' && styles.modeButtonTextActive]}>
            Registreren
          </Text>
        </TouchableOpacity>
      </View>

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
        placeholder={mode === 'login' ? 'Wachtwoord' : 'Wachtwoord (minimaal 6 karakters)'}
        placeholderTextColor="#999"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        editable={!loading}
      />

      {mode === 'register' && (
        <>
          <TextInput
            placeholder="Bevestig wachtwoord"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            editable={!loading}
          />

          <View style={styles.addressSection}>
            <Text style={styles.sectionHeading}>Adresgegevens</Text>
            <Text style={styles.sectionHelper}>
              We gebruiken je adres om te controleren of je verbonden bent aan een kast in de buurt.
            </Text>

            <TextInput
              placeholder="Straat"
              placeholderTextColor="#999"
              autoCapitalize="words"
              value={street}
              onChangeText={setStreet}
              style={styles.input}
              editable={!loading && !isFetchingAddress}
            />
            <TextInput
              placeholder="Huisnummer"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={houseNumber}
              onChangeText={setHouseNumber}
              style={styles.input}
              editable={!loading && !isFetchingAddress}
            />
            <TextInput
              placeholder="Postcode"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              value={postalCode}
              onChangeText={setPostalCode}
              style={styles.input}
              editable={!loading && !isFetchingAddress}
            />
            <TextInput
              placeholder="Plaats"
              placeholderTextColor="#999"
              autoCapitalize="words"
              value={city}
              onChangeText={setCity}
              style={styles.input}
              editable={!loading && !isFetchingAddress}
            />

            <TouchableOpacity
              style={[
                styles.locationButton,
                (loading || isFetchingAddress) && styles.buttonDisabled,
              ]}
              onPress={fillAddressFromLocation}
              disabled={loading || isFetchingAddress}>
              {isFetchingAddress ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#fff" />
                  <Text style={styles.locationButtonText}>Gebruik mijn locatie</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={handleAuth}>
        <Text style={styles.buttonText}>
          {loading ? 'Bezig...' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={() => withStatus(() => signInAnonymously())}>
        <Text style={styles.secondaryButtonText}>Ga verder als gast</Text>
      </TouchableOpacity>

      <View style={styles.helperBox}>
        <Text style={styles.helperTitle}>Waarom registreren?</Text>
        <Text style={styles.helperParagraph}>
          {mode === 'register'
            ? "Maak een account aan om je eigen minibieb toe te voegen, foto's te uploaden en deel te nemen aan de community."
            : "Log in om je favorieten te beheren, foto's toe te voegen aan listings en je eigen minibieb aan te maken."}
        </Text>
        {mode === 'login' && (
          <Text style={styles.helperParagraph}>
            Of ga verder als gast - je kunt later altijd nog een account aanmaken.
          </Text>
        )}
      </View>

      {status && <Text style={styles.statusMessage}>{status}</Text>}

      <RegistrationSuccessModal visible={showSuccessModal} onContinue={handleSuccessModalClose} />
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  modeButtonTextActive: {
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
  addressSection: {
    marginTop: 12,
    gap: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionHelper: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  locationButton: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
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
