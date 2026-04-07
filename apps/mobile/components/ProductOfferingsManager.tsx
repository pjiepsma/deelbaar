import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';

import Colors from '~/constants/Colors';
import {
  useProductOfferings,
  useCreateProductOffering,
  useUpdateProductOffering,
  useDeleteProductOffering,
} from '~/lib/hooks/useProductOfferings';

interface ProductOfferingsManagerProps {
  listingId: string;
  listingName: string;
  onClose: () => void;
}

export default function ProductOfferingsManager({
  listingId,
  listingName,
  onClose,
}: ProductOfferingsManagerProps) {
  const [isAddingOffering, setIsAddingOffering] = useState(false);
  const [newOffering, setNewOffering] = useState({
    productName: '',
    description: '',
    quantity: '',
    unit: 'stuks',
    price: '',
    category: '',
    usageInstructions: '',
    photos: [] as string[],
    openingHours: '',
  });

  const { data: offerings, isLoading } = useProductOfferings(listingId);
  const createOfferingMutation = useCreateProductOffering();
  const updateOfferingMutation = useUpdateProductOffering();
  const deleteOfferingMutation = useDeleteProductOffering();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Foto toestemming nodig',
        "Geef toegang tot je foto's om een foto toe te voegen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewOffering((prev) => ({
        ...prev,
        photos: [...prev.photos, result.assets[0].uri],
      }));
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Camera toestemming nodig', 'Geef toegang tot je camera om een foto te maken.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewOffering((prev) => ({
        ...prev,
        photos: [...prev.photos, result.assets[0].uri],
      }));
    }
  };

  const removePhoto = (index: number) => {
    setNewOffering((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleAddOffering = async () => {
    if (!newOffering.productName.trim()) {
      Alert.alert('Product naam verplicht', 'Geef een naam voor het product.');
      return;
    }

    try {
      await createOfferingMutation.mutateAsync({
        listingId,
        productName: newOffering.productName.trim(),
        description: newOffering.description.trim() || undefined,
        quantity: newOffering.quantity ? parseInt(newOffering.quantity) : undefined,
        unit: newOffering.unit.trim() || undefined,
        price: newOffering.price ? parseFloat(newOffering.price) : undefined,
        category: newOffering.category.trim() || undefined,
        ...(newOffering.usageInstructions.trim() && {
          usageInstructions: newOffering.usageInstructions.trim(),
        }),
        ...(newOffering.photos.length > 0 && {
          photos: newOffering.photos,
        }),
        ...(newOffering.openingHours.trim() && {
          openingHours: newOffering.openingHours.trim(),
        }),
      });

      setNewOffering({
        productName: '',
        description: '',
        quantity: '',
        unit: 'stuks',
        price: '',
        category: '',
        usageInstructions: '',
        photos: [],
        openingHours: '',
      });
      setIsAddingOffering(false);

      Alert.alert('Product toegevoegd!', 'Het product is toegevoegd aan je aanbod.');
    } catch (error) {
      Alert.alert('Fout', 'Kon product niet toevoegen. Probeer het opnieuw.');
    }
  };

  const handleToggleStatus = async (offeringId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';

    try {
      await updateOfferingMutation.mutateAsync({
        offeringId,
        updates: { status: newStatus },
      });

      Alert.alert(
        'Status bijgewerkt!',
        `Product is nu ${newStatus === 'available' ? 'beschikbaar' : 'uitverkocht'}.`
      );
    } catch (error) {
      Alert.alert('Fout', 'Kon status niet bijwerken.');
    }
  };

  const handleDeleteOffering = (offeringId: string, productName: string) => {
    Alert.alert(
      'Product verwijderen',
      `Weet je zeker dat je "${productName}" wilt verwijderen uit je aanbod?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOfferingMutation.mutateAsync(offeringId);
              Alert.alert('Verwijderd', 'Het product is uit je aanbod verwijderd.');
            } catch (error) {
              Alert.alert('Fout', 'Kon product niet verwijderen.');
            }
          },
        },
      ]
    );
  };

  const renderAddOfferingForm = () => (
    <View style={styles.addForm}>
      <Text style={styles.formTitle}>🛒 Product toevoegen</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Product naam *</Text>
        <TextInput
          style={styles.input}
          value={newOffering.productName}
          onChangeText={(text) => setNewOffering((prev) => ({ ...prev, productName: text }))}
          placeholder="Bijv. Biologische pompoenen"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Beschrijving (optioneel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newOffering.description}
          onChangeText={(text) => setNewOffering((prev) => ({ ...prev, description: text }))}
          placeholder="Bijv. Verse pompoenen uit eigen tuin"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Hoeveelheid</Text>
          <TextInput
            style={styles.input}
            value={newOffering.quantity}
            onChangeText={(text) => setNewOffering((prev) => ({ ...prev, quantity: text }))}
            placeholder="5"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Eenheid</Text>
          <TextInput
            style={styles.input}
            value={newOffering.unit}
            onChangeText={(text) => setNewOffering((prev) => ({ ...prev, unit: text }))}
            placeholder="kg, stuks, liter"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Prijs per eenheid (optioneel)</Text>
        <TextInput
          style={styles.input}
          value={newOffering.price}
          onChangeText={(text) => setNewOffering((prev) => ({ ...prev, price: text }))}
          placeholder="€2.50"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categorie (optioneel)</Text>
        <TextInput
          style={styles.input}
          value={newOffering.category}
          onChangeText={(text) => setNewOffering((prev) => ({ ...prev, category: text }))}
          placeholder="Bijv. Groente, Fruit, Zuivel"
        />
      </View>

      {/* Foto's upload sectie */}
      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>📸 Foto's (optioneel)</Text>
        <Text style={styles.photoDescription}>
          Voeg foto(s) toe om mensen te laten zien wat je aanbiedt.
        </Text>

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Ionicons name="camera" size={20} color={Colors.primary} />
            <Text style={styles.photoButtonText}>Foto maken</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Ionicons name="images" size={20} color={Colors.primary} />
            <Text style={styles.photoButtonText}>Uit galerij</Text>
          </TouchableOpacity>
        </View>

        {newOffering.photos.length > 0 && (
          <View style={styles.photoPreview}>
            <Text style={styles.photoPreviewTitle}>Geselecteerde foto's:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}>
              {newOffering.photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Openingstijden */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Openingstijden (optioneel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newOffering.openingHours}
          onChangeText={(text) => setNewOffering((prev) => ({ ...prev, openingHours: text }))}
          placeholder="Bijv. Ma-Vr 9:00-17:00, Za 10:00-16:00"
          multiline
          numberOfLines={2}
        />
        <Text style={styles.helperText}>
          Wanneer is je kast toegankelijk? Laat mensen weten wanneer ze kunnen komen.
        </Text>
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.formButton, styles.cancelButton]}
          onPress={() => {
            setIsAddingOffering(false);
            setNewOffering({
              productName: '',
              description: '',
              quantity: '',
              unit: 'stuks',
              price: '',
              category: '',
              usageInstructions: '',
              photos: [],
              openingHours: '',
            });
          }}>
          <Text style={styles.cancelButtonText}>Annuleren</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.formButton, styles.submitButton]}
          onPress={handleAddOffering}
          disabled={createOfferingMutation.isPending}>
          {createOfferingMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.submitButtonText}>Toevoegen</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOfferingsList = () => (
    <View style={styles.offeringsList}>
      <Text style={styles.sectionTitle}>Je producten bij {listingName}</Text>
      <Text style={styles.sectionDescription}>
        Beheer wat je aanbiedt. Mensen kunnen je producten favorieten en krijgen notificaties.
      </Text>

      {offerings && offerings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="basket-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Nog geen producten</Text>
          <Text style={styles.emptyDescription}>
            Voeg je eerste product toe om mensen te laten weten wat je aanbiedt!
          </Text>
        </View>
      ) : (
        offerings?.map((offering: any) => (
          <View key={offering.id} style={styles.offeringCard}>
            <View style={styles.offeringContent}>
              <Text style={styles.offeringTitle}>{offering.productName}</Text>
              {offering.description && (
                <Text style={styles.offeringDescription}>{offering.description}</Text>
              )}

              <View style={styles.offeringDetails}>
                {offering.quantity && offering.unit && (
                  <Text style={styles.offeringDetail}>
                    {offering.quantity} {offering.unit}
                  </Text>
                )}
                {offering.price && (
                  <Text style={styles.offeringDetail}>
                    €{offering.price.toFixed(2)} per {offering.unit || 'stuk'}
                  </Text>
                )}
                {offering.category && (
                  <Text style={styles.offeringDetail}>{offering.category}</Text>
                )}
              </View>

              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.statusText,
                    offering.status === 'available'
                      ? styles.statusAvailable
                      : styles.statusOutOfStock,
                  ]}>
                  {offering.status === 'available' ? 'Beschikbaar' : 'Uitverkocht'}
                </Text>
              </View>
            </View>

            <View style={styles.offeringActions}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  offering.status === 'available'
                    ? styles.statusButtonOut
                    : styles.statusButtonAvailable,
                ]}
                onPress={() => handleToggleStatus(offering.id, offering.status)}>
                <Ionicons
                  name={offering.status === 'available' ? 'eye-off' : 'eye'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.statusButtonText}>
                  {offering.status === 'available' ? 'Uitverk.' : 'Beschikbaar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteOffering(offering.id, offering.productName)}>
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product beheer</Text>
        <TouchableOpacity
          onPress={() => setIsAddingOffering(!isAddingOffering)}
          style={styles.addButton}>
          <Ionicons name={isAddingOffering ? 'close' : 'add'} size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAddingOffering ? renderAddOfferingForm() : renderOfferingsList()}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Producten laden...</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addForm: {
    paddingVertical: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  formButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offeringsList: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  offeringCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  offeringContent: {
    flex: 1,
  },
  offeringTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  offeringDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  offeringDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  offeringDetail: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusAvailable: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusOutOfStock: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
  },
  offeringActions: {
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  statusButtonAvailable: {
    backgroundColor: '#10b981',
  },
  statusButtonOut: {
    backgroundColor: '#ef4444',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  photoSection: {
    marginBottom: 20,
  },
  photoDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  photoPreview: {
    marginTop: 16,
  },
  photoPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  photoScroll: {
    marginTop: 8,
  },
  photoItem: {
    position: 'relative',
    marginRight: 12,
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
