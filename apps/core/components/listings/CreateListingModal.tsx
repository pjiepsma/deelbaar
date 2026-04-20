import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import type { Region } from '~/lib/utils/mapUtils';

import InventoryScanner from '~/components/books/InventoryScanner';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

import Colors from '~/constants/Colors';
import { mapStyleUrlForResolvedTheme } from '~/constants/Map';
import { useThemePreference } from '~/lib/providers/ThemePreferenceProvider';
import { payloadClient } from '~/lib/api/PayloadClient';
import { useCreateListing } from '~/lib/hooks/usePayloadQuery';

const { width, height } = Dimensions.get('window');

/** Values must match Payload listings `category` select (CMS). */
type ListingCategory =
  | 'book'
  | 'food'
  | 'hygiene'
  | 'community'
  | 'farm'
  | 'other';

const LEGACY_CATEGORY_ALIASES: Record<string, ListingCategory> = {
  book_bank: 'book',
  food_bank: 'food',
  hygiene_bank: 'hygiene',
  community_market: 'community',
  farm_vending: 'farm',
};

function normalizeListingCategory(raw: string | undefined | null): ListingCategory {
  const allowed = new Set<ListingCategory>([
    'book',
    'food',
    'hygiene',
    'community',
    'farm',
    'other',
  ]);
  if (!raw) return 'book';
  if (allowed.has(raw as ListingCategory)) return raw as ListingCategory;
  return LEGACY_CATEGORY_ALIASES[raw] ?? 'book';
}

interface InventoryItem {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  category: string;
  confidence: number;
  imageUri?: string;
  status: 'detected' | 'confirmed' | 'manual';
}

interface CategoryOption {
  value: ListingCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const FACILITY_OPTIONS = [
  { value: '24_7_access', label: '24/7 Toegang', icon: 'time-outline' },
  { value: 'wheelchair_accessible', label: 'Rolstoeltoegankelijk', icon: 'accessibility-outline' },
  { value: 'parking', label: 'Parkeren mogelijk', icon: 'car-outline' },
  { value: 'indoor', label: 'Binnenlocatie', icon: 'home-outline' },
  { value: 'outdoor', label: 'Buitenlocatie', icon: 'leaf-outline' },
  { value: 'sheltered', label: 'Beschut', icon: 'shield-outline' },
  { value: 'lighting', label: 'Verlichting', icon: 'bulb-outline' },
  { value: 'security_camera', label: 'Beveiligingscamera', icon: 'videocam-outline' },
  { value: 'contact_required', label: 'Contact vereist', icon: 'call-outline' },
  { value: 'free_access', label: 'Gratis toegang', icon: 'cash-outline' },
  { value: 'membership_required', label: 'Lidmaatschap vereist', icon: 'card-outline' },
];

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: 'book',
    label: 'Minibieb',
    description: 'Boeken delen en ruilen',
    icon: 'library',
    color: '#3B82F6',
  },
  {
    value: 'food',
    label: 'Voedselkast',
    description: 'Supermarkt producten delen (spaghetti, saus, bonen, conserven)',
    icon: 'storefront',
    color: '#EF4444',
  },
  {
    value: 'hygiene',
    label: 'Hygiënekast',
    description: 'Gratis hygiëne producten',
    icon: 'medical',
    color: '#EC4899',
  },
  {
    value: 'community',
    label: 'Gemeenschapskast',
    description: 'Verse lokale producten (aardbeien, honing, pompoenen, zelfgeteelde groente)',
    icon: 'restaurant',
    color: '#22C55E',
  },
  {
    value: 'farm',
    label: 'Boerderijautomaat',
    description: 'Automaten bij boeren met verse producten (melk, eieren, groente)',
    icon: 'nutrition',
    color: '#A16207',
  },
  {
    value: 'other',
    label: 'Anders',
    description: 'Andere soorten kasten of voorzieningen',
    icon: 'apps',
    color: '#6B7280',
  },
];

interface CreateListingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'category' | 'details' | 'location' | 'facilities' | 'photos' | 'review';

export default function CreateListingModal({
  visible,
  onClose,
  onSuccess,
}: CreateListingModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('category');

  // Form data
  const [category, setCategory] = useState<ListingCategory>('book');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // New fields for enhanced listing info
  const [publishStatus, setPublishStatus] = useState<'draft' | 'live'>('draft');
  const [openingHours, setOpeningHours] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [houseRules, setHouseRules] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // UI state
  const [locationLoading, setLocationLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 52.0907,
    longitude: 5.1214,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createListing = useCreateListing();
  const { resolvedTheme } = useThemePreference();
  const mapStyleUrl = useMemo(
    () => mapStyleUrlForResolvedTheme(resolvedTheme),
    [resolvedTheme],
  );

  // Reset form when modal opens and try to load draft
  useEffect(() => {
    if (visible) {
      resetForm();
      // Try to load draft after a short delay to ensure form is reset
      setTimeout(() => {
        loadDraft();
      }, 100);
    }
  }, [visible]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setCurrentStep('category');
    setCategory('book');
    setName('');
    setDescription('');
    setAddress('');
    setCoordinates(null);
    setPhotos([]);
    setMapRegion({
      latitude: 52.0907,
      longitude: 5.1214,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const nextStep = () => {
    const steps: Step[] = ['category', 'details', 'location', 'facilities', 'photos', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['category', 'details', 'location', 'facilities', 'photos', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const getCurrentStepIndex = () => {
    const steps: Step[] = ['category', 'details', 'location', 'facilities', 'photos', 'review'];
    return steps.indexOf(currentStep);
  };

  // Real-time validation
  const validateField = (fieldName: string, value: string) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Naam is verplicht';
        } else if (value.trim().length < 3) {
          errors.name = 'Naam moet minimaal 3 karakters bevatten';
        } else if (value.trim().length > 100) {
          errors.name = 'Naam mag maximaal 100 karakters bevatten';
        } else {
          delete errors.name;
        }
        break;
      case 'description':
        if (value.length > 500) {
          errors.description = 'Beschrijving mag maximaal 500 karakters bevatten';
        } else {
          delete errors.description;
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'details':
        const nameValid = validateField('name', name);
        const descValid = validateField('description', description);
        if (!nameValid || !descValid) {
          Alert.alert('Verplichte velden', 'Controleer de rood gemarkeerde velden.');
          return false;
        }
        return true;
      case 'location':
        if (!coordinates) {
          Alert.alert('Locatie verplicht', 'Selecteer een locatie op de kaart.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
    }
  };

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Locatie toestemming nodig',
          'Geef toestemming voor locatie om je huidige positie te gebruiken.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setMapRegion(newRegion);
      setCoordinates([location.coords.longitude, location.coords.latitude]);

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const addressString = [addr.street, addr.streetNumber, addr.city].filter(Boolean).join(' ');
        setAddress(addressString);
      }
    } catch (error) {
      console.warn('Location error:', error);
      Alert.alert('Locatie fout', 'Kon locatie niet ophalen.');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.warn('Image picker error:', error);
      Alert.alert('Foto fout', 'Kon foto niet selecteren.');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.warn('Camera error:', error);
      Alert.alert('Camera fout', 'Kon foto niet maken.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMapPress = (event: any) => {
    const [longitude, latitude] = event.geometry.coordinates;
    setCoordinates([longitude, latitude]);

    // Update map region to center on selected location
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
  };

  // Draft save functionality
  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      // Save draft to AsyncStorage for later retrieval
      const draftData = {
        category,
        name,
        description,
        address,
        coordinates,
        photos,
        lastSaved: new Date().toISOString(),
      };

      await AsyncStorage.setItem('listing_draft', JSON.stringify(draftData));
      Alert.alert('Concept opgeslagen', 'Je voortgang is opgeslagen als concept.');
    } catch (error) {
      console.warn('Draft save error:', error);
    } finally {
      setSavingDraft(false);
    }
  };

  const loadDraft = async () => {
    try {
      const draftJson = await AsyncStorage.getItem('listing_draft');
      if (draftJson) {
        const draftData = JSON.parse(draftJson);
        setCategory(normalizeListingCategory(draftData.category));
        setName(draftData.name || '');
        setDescription(draftData.description || '');
        setAddress(draftData.address || '');
        setCoordinates(draftData.coordinates || null);
        setPhotos(draftData.photos || []);
        return true;
      }
    } catch (error) {
      console.warn('Draft load error:', error);
    }
    return false;
  };

  const handleCreate = async () => {
    if (!validateStep('details') || !validateStep('location')) {
      return;
    }

    try {
      const location = {
        address: address.trim() || undefined,
        coordinates,
      };

      await createListing.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category,
        location,
        publishStatus,
        facilities: {
          openingHours: openingHours.trim() || undefined,
          facilities: selectedFacilities.map(facility => ({ facility })),
          rules: houseRules.trim() || undefined,
          contactInfo: contactInfo.trim() || undefined,
        },
      });

      // Clear draft after successful creation
      await AsyncStorage.removeItem('listing_draft');

      Alert.alert(
        '🎉 Listing aangemaakt!',
        'Je locatie is succesvol toegevoegd aan Deelbaar. Anderen kunnen hem nu vinden op de kaart.',
        [
          {
            text: 'Bekijken',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Create listing error:', error);

      let errorMessage = 'Er ging iets mis bij het aanmaken van je listing.';

      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage =
          'Geen internetverbinding. Je listing wordt lokaal opgeslagen en gesynchroniseerd zodra je weer online bent.';
      } else if (error.message?.includes('duplicate') || error.message?.includes('exists')) {
        errorMessage = 'Er bestaat al een listing met deze naam op deze locatie.';
      } else if (error.message?.includes('validation')) {
        errorMessage = 'Controleer je invoer en probeer het opnieuw.';
      }

      Alert.alert('Aanmaken mislukt', errorMessage, [
        { text: 'Opnieuw proberen', style: 'default' },
        { text: 'Concept opslaan', onPress: saveDraft, style: 'default' },
        { text: 'Annuleren', style: 'cancel' },
      ]);
    }
  };

  // Enhanced input handlers with validation
  const handleNameChange = (text: string) => {
    setName(text);
    validateField('name', text);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    validateField('description', text);
  };

  const handleInventoryItemsDetected = (items: InventoryItem[]) => {
    setInventory(items);
  };

  const renderStepIndicator = () => {
    const steps: Step[] = ['category', 'details', 'location', 'photos', 'review'];
    const currentIndex = getCurrentStepIndex();

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepItem}>
            <View style={[styles.stepCircle, index <= currentIndex && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, index <= currentIndex && styles.stepNumberActive]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, index <= currentIndex && styles.stepLabelActive]}>
              {step === 'category'
                ? 'Type'
                : step === 'details'
                  ? 'Details'
                  : step === 'location'
                    ? 'Locatie'
                    : step === 'facilities'
                      ? 'Voorzieningen'
                      : step === 'photos'
                        ? "Foto's"
                        : 'Klaar'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCategoryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Wat voor locatie wil je toevoegen?</Text>
      <Text style={styles.stepDescription}>
        Kies het type locatie dat het beste past bij wat je wilt delen met de community.
      </Text>

      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        {CATEGORY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.categoryCard, category === option.value && styles.categoryCardSelected]}
            onPress={() => setCategory(option.value)}>
            <View style={[styles.categoryIcon, { backgroundColor: option.color }]}>
              <Ionicons name={option.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.categoryInfo}>
              <Text
                style={[
                  styles.categoryTitle,
                  category === option.value && styles.categoryTitleSelected,
                ]}>
                {option.label}
              </Text>
              <Text
                style={[
                  styles.categoryDescription,
                  category === option.value && styles.categoryDescriptionSelected,
                ]}>
                {option.description}
              </Text>
            </View>
            {category === option.value && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Vertel ons meer over je locatie</Text>
      <Text style={styles.stepDescription}>
        Geef je locatie een duidelijke naam en beschrijving zodat anderen weten wat ze kunnen
        verwachten.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Naam *</Text>
        <TextInput
          style={[styles.input, fieldErrors.name && styles.inputError]}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Bijv. Minibieb aan de Dorpsstraat"
          maxLength={100}
        />
        {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Beschrijving</Text>
        <TextInput
          style={[styles.input, styles.textArea, fieldErrors.description && styles.inputError]}
          value={description}
          onChangeText={handleDescriptionChange}
          placeholder="Vertel iets over deze locatie, openingstijden, regels, etc."
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
        {fieldErrors.description && <Text style={styles.errorText}>{fieldErrors.description}</Text>}
      </View>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Waar is je locatie?</Text>
      <Text style={styles.stepDescription}>
        Selecteer de exacte locatie op de kaart zodat anderen je locatie kunnen vinden.
      </Text>

      <TouchableOpacity
        style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]}
        onPress={requestLocationPermission}
        disabled={locationLoading}>
        <Ionicons name="locate" size={20} color="#fff" />
        <Text style={styles.locationButtonText}>
          {locationLoading ? 'Zoeken...' : 'Gebruik mijn locatie'}
        </Text>
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        {mapboxToken ? (
          <MapView
            style={styles.map}
            styleURL={mapStyleUrl}
            onPress={handleMapPress}>
            <Camera
              defaultSettings={{
                centerCoordinate: coordinates ?? [mapRegion.longitude, mapRegion.latitude],
                zoomLevel: Math.log2(360 / mapRegion.latitudeDelta),
              }}
              centerCoordinate={coordinates ?? [mapRegion.longitude, mapRegion.latitude]}
              zoomLevel={Math.log2(360 / mapRegion.latitudeDelta)}
            />
            <Mapbox.UserLocation visible={true} />
            {coordinates && (
              <PointAnnotation
                id="selected-location"
                coordinate={coordinates}
                anchor={{ x: 0.5, y: 1 }}>
                <View style={{ padding: 8, backgroundColor: Colors.primary, borderRadius: 4 }}>
                  <Text style={{ color: 'white', fontSize: 12 }}>Geselecteerde locatie</Text>
                </View>
              </PointAnnotation>
            )}
          </MapView>
        ) : (
          <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }]}>
            <Text style={{ color: '#666' }}>Mapbox token niet geconfigureerd</Text>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Adres (optioneel)</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Straat, huisnummer, plaats"
        />
      </View>
    </View>
  );

  const toggleFacility = (facilityValue: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facilityValue)
        ? prev.filter(f => f !== facilityValue)
        : [...prev, facilityValue]
    );
  };

  const renderFacilitiesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Voorzieningen en regels</Text>
      <Text style={styles.stepDescription}>
        Vertel meer over de voorzieningen en regels van je locatie om mensen goed te informeren.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Openingstijden</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={openingHours}
          onChangeText={setOpeningHours}
          placeholder="Bijv. Ma-Vr 9:00-17:00, Za 10:00-16:00"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Voorzieningen</Text>
        <Text style={styles.facilityDescription}>
          Selecteer welke voorzieningen beschikbaar zijn op je locatie:
        </Text>
        <View style={styles.facilityGrid}>
          {FACILITY_OPTIONS.map((facility) => (
            <TouchableOpacity
              key={facility.value}
              style={[
                styles.facilityChip,
                selectedFacilities.includes(facility.value) && styles.facilityChipSelected,
              ]}
              onPress={() => toggleFacility(facility.value)}>
              <Ionicons
                name={facility.icon as any}
                size={16}
                color={selectedFacilities.includes(facility.value) ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.facilityChipText,
                  selectedFacilities.includes(facility.value) && styles.facilityChipTextSelected,
                ]}>
                {facility.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Huisregels</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={houseRules}
          onChangeText={setHouseRules}
          placeholder="Bijv. Respecteer andermans spullen, geen glaswerk, etc."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Contactinformatie</Text>
        <TextInput
          style={styles.input}
          value={contactInfo}
          onChangeText={setContactInfo}
          placeholder="Bijv. naam@email.com of tel: 06-12345678"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Publicatiestatus</Text>
        <View style={styles.publishStatusContainer}>
          <TouchableOpacity
            style={[
              styles.publishStatusButton,
              publishStatus === 'draft' && styles.publishStatusButtonSelected,
            ]}
            onPress={() => setPublishStatus('draft')}>
            <Ionicons
              name="create-outline"
              size={20}
              color={publishStatus === 'draft' ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.publishStatusText,
                publishStatus === 'draft' && styles.publishStatusTextSelected,
              ]}>
              Concept
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.publishStatusButton,
              publishStatus === 'live' && styles.publishStatusButtonSelected,
            ]}
            onPress={() => setPublishStatus('live')}>
            <Ionicons
              name="globe-outline"
              size={20}
              color={publishStatus === 'live' ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.publishStatusText,
                publishStatus === 'live' && styles.publishStatusTextSelected,
              ]}>
              Publiek
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.publishStatusDescription}>
          {publishStatus === 'draft'
            ? 'Concept listings zijn alleen zichtbaar voor jou en admins'
            : 'Publieke listings zijn zichtbaar voor iedereen in de app'}
        </Text>
      </View>
    </View>
  );

  const renderPhotosStep = () => {
    // Special handling for book - show inventory scanner
    if (category === 'book') {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>📚 Boekenkast inventaris</Text>
          <Text style={styles.stepDescription}>
            Voeg boeken toe aan je boekenkast door ISBN barcodes te scannen of handmatig in te
            voeren.
          </Text>

          <InventoryScanner
            onItemsDetected={handleInventoryItemsDetected}
            existingItems={inventory}
          />

          <View style={styles.inventorySummary}>
            <Text style={styles.summaryText}>
              {inventory.length} item{inventory.length !== 1 ? 's' : ''} toegevoegd
            </Text>
          </View>
        </View>
      );
    }

    // Default photo upload for other categories
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Foto's van je locatie</Text>
        <Text style={styles.stepDescription}>
          Voeg foto\'s toe zodat anderen een beter beeld krijgen van je locatie. Dit is optioneel
          maar wordt aanbevolen.
        </Text>

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Ionicons name="images" size={24} color={Colors.primary} />
            <Text style={styles.photoButtonText}>Kies uit galerij</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color={Colors.primary} />
            <Text style={styles.photoButtonText}>Maak foto</Text>
          </TouchableOpacity>
        </View>

        {photos.length > 0 && (
          <ScrollView
            horizontal
            style={styles.photosContainer}
            showsHorizontalScrollIndicator={false}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {photos.length === 0 && (
          <View style={styles.noPhotos}>
            <Ionicons name="images-outline" size={48} color="#ccc" />
            <Text style={styles.noPhotosText}>Nog geen foto\'s toegevoegd</Text>
          </View>
        )}
      </View>
    );
  };

  const renderReviewStep = () => {
    const selectedCategory = CATEGORY_OPTIONS.find((cat) => cat.value === category);

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Controleer je gegevens</Text>
        <Text style={styles.stepDescription}>
          Bekijk je gegevens nog een keer voordat je de listing aanmaakt.
        </Text>

        <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Type locatie</Text>
            <View style={styles.reviewItem}>
              <View style={[styles.categoryIcon, { backgroundColor: selectedCategory?.color }]}>
                <Ionicons name={selectedCategory?.icon as any} size={20} color="#fff" />
              </View>
              <Text style={styles.reviewItemText}>{selectedCategory?.label}</Text>
            </View>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Details</Text>
            <View style={styles.reviewItem}>
              <Ionicons name="business" size={20} color="#666" />
              <View style={styles.reviewTextContainer}>
                <Text style={styles.reviewItemTitle}>Naam</Text>
                <Text style={styles.reviewItemText}>{name}</Text>
              </View>
            </View>
            {description && (
              <View style={styles.reviewItem}>
                <Ionicons name="document-text" size={20} color="#666" />
                <View style={styles.reviewTextContainer}>
                  <Text style={styles.reviewItemTitle}>Beschrijving</Text>
                  <Text style={styles.reviewItemText}>{description}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Locatie</Text>
            <View style={styles.reviewItem}>
              <Ionicons name="location" size={20} color="#666" />
              <View style={styles.reviewTextContainer}>
                <Text style={styles.reviewItemTitle}>Coördinaten</Text>
                <Text style={styles.reviewItemText}>
                  {coordinates
                    ? `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`
                    : 'Niet ingesteld'}
                </Text>
              </View>
            </View>
            {address && (
              <View style={styles.reviewItem}>
                <Ionicons name="home" size={20} color="#666" />
                <View style={styles.reviewTextContainer}>
                  <Text style={styles.reviewItemTitle}>Adres</Text>
                  <Text style={styles.reviewItemText}>{address}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Show inventory for book */}
          {category === 'book' && inventory.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>
                📚 Inventaris ({inventory.length} items)
              </Text>
              <View style={styles.inventoryPreview}>
                {inventory.slice(0, 3).map((item, index) => (
                  <View key={item.id} style={styles.inventoryItem}>
                    <Text style={styles.inventoryItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.author && (
                      <Text style={styles.inventoryItemAuthor} numberOfLines={1}>
                        {item.author}
                      </Text>
                    )}
                  </View>
                ))}
                {inventory.length > 3 && (
                  <Text style={styles.moreItems}>+{inventory.length - 3} meer...</Text>
                )}
              </View>
            </View>
          )}

          {/* Show photos for non-minibieb */}
          {category !== 'book' && photos.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Foto's ({photos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((uri, index) => (
                  <Image key={index} source={{ uri }} style={styles.reviewPhoto} />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'category':
        return renderCategoryStep();
      case 'details':
        return renderDetailsStep();
      case 'location':
        return renderLocationStep();
      case 'facilities':
        return renderFacilitiesStep();
      case 'photos':
        return renderPhotosStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Nieuwe locatie toevoegen</Text>
            {isOffline && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="cloud-offline" size={14} color="#ef4444" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={saveDraft} disabled={savingDraft} style={styles.draftButton}>
            {savingDraft ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="save-outline" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep !== 'category' && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Text style={styles.backButtonText}>Terug</Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }} />

          {currentStep === 'review' ? (
            <TouchableOpacity
              style={[styles.nextButton, createListing.isPending && styles.nextButtonDisabled]}
              onPress={handleCreate}
              disabled={createListing.isPending}>
              {createListing.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Aanmaken</Text>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Volgende</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  offlineText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  draftButton: {
    padding: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  categoryList: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#eff6ff',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryTitleSelected: {
    color: Colors.primary,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryDescriptionSelected: {
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  map: {
    flex: 1,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  photosContainer: {
    marginBottom: 16,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotos: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPhotosText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  reviewContainer: {
    flex: 1,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  reviewItemTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reviewItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  reviewPhoto: {
    width: 80,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inventorySummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  inventoryPreview: {
    gap: 8,
  },
  inventoryItem: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inventoryItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  inventoryItemAuthor: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  facilityDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  facilityChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  facilityChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  facilityChipTextSelected: {
    color: '#fff',
  },
  publishStatusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  publishStatusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  publishStatusButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  publishStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  publishStatusTextSelected: {
    color: '#fff',
  },
  publishStatusDescription: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
