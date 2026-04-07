import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import StepContainer from '~/components/StepContainer';
import Colors from '~/constants/Colors';

export default function Step3Address() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const password = params.password as string;

  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ street?: string; houseNumber?: string; postalCode?: string; city?: string }>({});

  const validateForm = () => {
    const newErrors: { street?: string; houseNumber?: string; postalCode?: string; city?: string } = {};

    if (!street.trim()) {
      newErrors.street = 'Straat is verplicht';
    }

    if (!houseNumber.trim()) {
      newErrors.houseNumber = 'Huisnummer is verplicht';
    }

    if (!postalCode.trim()) {
      newErrors.postalCode = 'Postcode is verplicht';
    }

    if (!city.trim()) {
      newErrors.city = 'Plaats is verplicht';
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
      // Proceed to profile setup step
      router.push({
        pathname: '/(tabs)/profile/register/step4-profile',
        params: {
          email,
          password,
          address: JSON.stringify({
            street: street.trim(),
            houseNumber: houseNumber.trim(),
            postalCode: postalCode.trim(),
            city: city.trim(),
          }),
        },
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Fout', 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const fillAddressFromLocation = async () => {
    if (loading || isFetchingAddress) return;

    try {
      setIsFetchingAddress(true);
      setErrors({});

      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Locatie geweigerd', 'Locatietoegang is nodig om je adres automatisch in te vullen.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync(position.coords);
      const [geo] = geocode;

      if (!geo) {
        Alert.alert('Adres niet gevonden', 'Kon je adres niet bepalen. Vul het handmatig in.');
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

      // Clear any existing errors
      setErrors({});
    } catch (error) {
      console.warn('fillAddressFromLocation error', error);
      Alert.alert('Fout', 'Er ging iets mis bij het ophalen van je adres.');
    } finally {
      setIsFetchingAddress(false);
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
      title="Adresgegevens"
      subtitle="We gebruiken je adres om te controleren of je verbonden bent aan een kast in de buurt"
      currentStep={3}
      totalSteps={4}
      stepLabels={stepLabels}
      onBack={handleBack}
      nextButton={{
        title: 'Verder',
        onPress: handleNext,
        loading,
        disabled: loading,
      }}
    >
      <View style={styles.form}>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.streetInput]}>
            <Text style={styles.label}>Straat</Text>
            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              placeholder="Straatnaam"
              placeholderTextColor="#9ca3af"
              value={street}
              onChangeText={(text) => {
                setStreet(text);
                if (errors.street) setErrors({ ...errors, street: undefined });
              }}
              autoCapitalize="words"
              editable={!loading && !isFetchingAddress}
            />
            {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
          </View>

          <View style={[styles.inputGroup, styles.houseNumberInput]}>
            <Text style={styles.label}>Huisnummer</Text>
            <TextInput
              style={[styles.input, errors.houseNumber && styles.inputError]}
              placeholder="Nr."
              placeholderTextColor="#9ca3af"
              value={houseNumber}
              onChangeText={(text) => {
                setHouseNumber(text);
                if (errors.houseNumber) setErrors({ ...errors, houseNumber: undefined });
              }}
              autoCapitalize="none"
              editable={!loading && !isFetchingAddress}
            />
            {errors.houseNumber && <Text style={styles.errorText}>{errors.houseNumber}</Text>}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, styles.postalCodeInput]}>
            <Text style={styles.label}>Postcode</Text>
            <TextInput
              style={[styles.input, errors.postalCode && styles.inputError]}
              placeholder="1234 AB"
              placeholderTextColor="#9ca3af"
              value={postalCode}
              onChangeText={(text) => {
                setPostalCode(text);
                if (errors.postalCode) setErrors({ ...errors, postalCode: undefined });
              }}
              autoCapitalize="characters"
              editable={!loading && !isFetchingAddress}
            />
            {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
          </View>

          <View style={[styles.inputGroup, styles.cityInput]}>
            <Text style={styles.label}>Plaats</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Plaatsnaam"
              placeholderTextColor="#9ca3af"
              value={city}
              onChangeText={(text) => {
                setCity(text);
                if (errors.city) setErrors({ ...errors, city: undefined });
              }}
              autoCapitalize="words"
              editable={!loading && !isFetchingAddress}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.locationButton,
            (loading || isFetchingAddress) && styles.buttonDisabled,
          ]}
          onPress={fillAddressFromLocation}
          disabled={loading || isFetchingAddress}
        >
          {isFetchingAddress ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.locationButtonText}>Bezig met ophalen...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="locate" size={18} color="#fff" />
              <Text style={styles.locationButtonText}>Gebruik mijn locatie</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 8,
  },
  streetInput: {
    flex: 2,
  },
  houseNumberInput: {
    flex: 1,
  },
  postalCodeInput: {
    flex: 1,
  },
  cityInput: {
    flex: 2,
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
  locationButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});









