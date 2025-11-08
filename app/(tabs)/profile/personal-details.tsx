import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import {
  Alert,
  Image,
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

type FormState = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthDate: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  bio: string;
  website: string;
};

const DEFAULT_FORM: FormState = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  birthDate: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  bio: '',
  website: '',
};

const DATE_REGEX = /^\d{2}-\d{2}-\d{4}$/;

export default function PersonalDetailsScreen() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.name || '',
      lastName: (user as any)?.surname || '',
      phoneNumber: (user as any)?.phoneNumber || '',
      birthDate: (user as any)?.birthDate
        ? new Date((user as any).birthDate).toLocaleDateString('nl-NL')
        : '',
      street: (user as any)?.address?.street || '',
      houseNumber: (user as any)?.address?.houseNumber || '',
      postalCode: (user as any)?.address?.postalCode || '',
      city: (user as any)?.address?.city || '',
      bio: (user as any)?.bio || '',
      website: (user as any)?.website || '',
    });
    const currentAvatar = (user as any)?.avatar?.url;
    setAvatarUri(currentAvatar || null);
  }, [user]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Toestemming vereist', 'Geef toegang tot je foto’s om een profielfoto te kiezen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    if (form.birthDate && !DATE_REGEX.test(form.birthDate)) {
      Alert.alert('Ongeldige datum', 'Gebruik het formaat DD-MM-JJJJ voor je geboortedatum.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Fout', 'Gebruiker niet gevonden. Log opnieuw in.');
      return;
    }
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      let avatarId: string | undefined;
      if (avatarUri && avatarUri.startsWith('file')) {
        const upload = await payloadClient.uploadFile(
          {
            uri: avatarUri,
            type: 'image/jpeg',
            name: `profile-${Date.now()}.jpg`,
          },
          `Profielfoto van ${user.email || user.id}`
        );
        if (upload.error) {
          throw new Error(upload.error?.message || 'Kon de profielfoto niet uploaden.');
        }
        avatarId = upload.data?.id;
      }

      let birthDateISO: string | undefined;
      if (form.birthDate) {
        const [day, month, year] = form.birthDate.split('-');
        birthDateISO = new Date(`${year}-${month}-${day}`).toISOString();
      }

      const payloadBody: any = {
        name: form.firstName,
        surname: form.lastName,
        phoneNumber: form.phoneNumber,
        birthDate: birthDateISO,
        address: {
          street: form.street,
          houseNumber: form.houseNumber,
          postalCode: form.postalCode,
          city: form.city,
        },
        bio: form.bio,
        website: form.website,
      };

      if (avatarId) {
        payloadBody.avatar = avatarId;
      }

      const { error } = await payloadClient.update('users', user.id, payloadBody);
      if (error) {
        throw new Error(error.message || 'Kon je gegevens niet bewaren.');
      }

      Alert.alert('Opgeslagen', 'Je gegevens zijn bijgewerkt.');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Fout', error.message || 'Er is iets misgegaan bij het opslaan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Persoonlijke gegevens</Text>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLabel}>
                {(form.firstName[0] || user?.email?.[0] || 'D').toUpperCase()}
              </Text>
            )}
          </View>
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickAvatar}>
              <Text style={styles.changePhotoText}>Wijzig foto</Text>
            </TouchableOpacity>
          )}
        </View>

        <Section title="Persoonlijke informatie">
          <Input
            label="Voornaam"
            value={form.firstName}
            editable={isEditing}
            onChangeText={(text) => updateField('firstName', text)}
            placeholder="Je voornaam"
          />
          <Input
            label="Achternaam"
            value={form.lastName}
            editable={isEditing}
            onChangeText={(text) => updateField('lastName', text)}
            placeholder="Je achternaam"
          />
          <Input label="E-mailadres" value={user?.email || ''} editable={false} />
          <Input
            label="Telefoonnummer"
            value={form.phoneNumber}
            editable={isEditing}
            onChangeText={(text) => updateField('phoneNumber', text)}
            placeholder="+31 6 12345678"
            keyboardType="phone-pad"
          />
          <Input
            label="Geboortedatum"
            value={form.birthDate}
            editable={isEditing}
            onChangeText={(text) => updateField('birthDate', text)}
            placeholder="DD-MM-JJJJ"
            keyboardType="numeric"
          />
        </Section>

        <Section title="Adres">
          <Input
            label="Straat"
            value={form.street}
            editable={isEditing}
            onChangeText={(text) => updateField('street', text)}
            placeholder="Straatnaam"
          />
          <Input
            label="Huisnummer"
            value={form.houseNumber}
            editable={isEditing}
            onChangeText={(text) => updateField('houseNumber', text)}
            placeholder="Nr."
            keyboardType="numeric"
          />
          <Input
            label="Postcode"
            value={form.postalCode}
            editable={isEditing}
            onChangeText={(text) => updateField('postalCode', text)}
            placeholder="1234 AB"
          />
          <Input
            label="Stad"
            value={form.city}
            editable={isEditing}
            onChangeText={(text) => updateField('city', text)}
            placeholder="Stad"
          />
        </Section>

        <Section title="Over jezelf">
          <Input
            label="Bio"
            value={form.bio}
            editable={isEditing}
            onChangeText={(text) => updateField('bio', text)}
            placeholder="Vertel iets over jezelf..."
            multiline
          />
          <Input
            label="Website"
            value={form.website}
            editable={isEditing}
            onChangeText={(text) => updateField('website', text)}
            placeholder="https://jouw-website.nl"
            keyboardType="url"
          />
        </Section>

        <View style={styles.actions}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isSaving}>
                <Text style={styles.buttonText}>{isSaving ? 'Opslaan...' : 'Opslaan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  if (user) {
                    setForm({
                      firstName: user.name || '',
                      lastName: (user as any)?.surname || '',
                      phoneNumber: (user as any)?.phoneNumber || '',
                      birthDate: (user as any)?.birthDate
                        ? new Date((user as any).birthDate).toLocaleDateString('nl-NL')
                        : '',
                      street: (user as any)?.address?.street || '',
                      houseNumber: (user as any)?.address?.houseNumber || '',
                      postalCode: (user as any)?.address?.postalCode || '',
                      city: (user as any)?.address?.city || '',
                      bio: (user as any)?.bio || '',
                      website: (user as any)?.website || '',
                    });
                    setAvatarUri((user as any)?.avatar?.url || null);
                  }
                }}>
                <Text style={[styles.buttonText, styles.cancelText]}>Annuleren</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}>
              <Text style={styles.buttonText}>Bewerken</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'numeric' | 'url' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
    gap: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4a6c',
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9ddc2',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarLabel: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1f2937',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  changePhotoText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2563eb',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelText: {
    color: '#1f2937',
  },
});


