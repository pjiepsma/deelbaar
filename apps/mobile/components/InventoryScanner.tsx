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
} from 'react-native';

import BookScanner from './BookScanner';
import { analyzeBookshelf } from '~/lib/ai';

import Colors from '~/constants/Colors';
import { useMatchingWishes } from '~/lib/hooks/useBookWishes';

interface InventoryItem {
  id: string;
  title: string;
  author: string;
  category: string;
  confidence: number;
  status: 'detected' | 'confirmed' | 'manual';
}

interface InventoryScannerProps {
  onItemsDetected: (items: InventoryItem[]) => void;
  existingItems?: InventoryItem[];
}

export default function InventoryScanner({
  onItemsDetected,
  existingItems = [],
}: InventoryScannerProps) {
  const [detectedItems, setDetectedItems] = useState<InventoryItem[]>(existingItems);
  const [lastAddedBook, setLastAddedBook] = useState<any>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  // Check for matching wishes when a book is added
  const { data: matchingWishes } = useMatchingWishes(
    lastAddedBook
      ? {
          title: lastAddedBook.title,
          author: lastAddedBook.authors?.join(', '),
          isbn: lastAddedBook.isbn,
        }
      : { title: '' }
  );

  const handleBookScanned = (bookData: any) => {
    // Converteer Google Books data naar InventoryItem format
    const inventoryItem: InventoryItem = {
      id: bookData.id,
      title: bookData.title,
      author: bookData.authors?.join(', ') || 'Onbekende auteur',
      category: bookData.categories?.[0] || 'Onbekend',
      confidence: 1.0,
      status: 'confirmed',
    };

    setDetectedItems((prev) => [...prev, inventoryItem]);
    setLastAddedBook(bookData);

    // Show initial success message
    Alert.alert('Boek toegevoegd! 📚', `"${bookData.title}" is toegevoegd aan je inventaris.`, [
      { text: 'OK' },
    ]);
  };

  // Show wish match notification when data is loaded
  React.useEffect(() => {
    if (matchingWishes && matchingWishes.length > 0 && lastAddedBook) {
      setTimeout(() => {
        Alert.alert(
          '🎉 Match gevonden!',
          `${matchingWishes.length} persoon(en) willen "${lastAddedBook.title}" graag lezen!\n\nJe helpt iemand blij maken! 😊`,
          [{ text: 'Geweldig!' }]
        );
      }, 500); // Small delay to show after initial success message
    }
  }, [matchingWishes, lastAddedBook]);

  const removeItem = (id: string) => {
    setDetectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAnalyzeBookshelfPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Toestemming vereist',
          'Geef toegang tot de camera om een foto van je boekenkast te maken.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        console.warn('[InventoryScanner] Scan cancelled or no URI');
        return;
      }

      console.warn('[InventoryScanner] Calling analyzeBookshelf', result.assets[0].uri?.slice(0, 50));
      setIsAnalyzingPhoto(true);
      const detections = await analyzeBookshelf(result.assets[0].uri);

      if (detections.length === 0) {
        Alert.alert(
          'Geen boeken gevonden',
          'Er werden geen boektitels herkend op de foto. Probeer een duidelijkere foto of voeg boeken handmatig toe.'
        );
        return;
      }

      const newItems: InventoryItem[] = detections.map((d) => ({
        id: d.id,
        title: d.title,
        author: d.author || 'Onbekende auteur',
        category: d.category || 'Onbekend',
        confidence: d.confidence,
        status: 'detected' as const,
      }));

      setDetectedItems((prev) => [...prev, ...newItems]);
      Alert.alert(
        'Boeken gevonden! 📚',
        `${detections.length} mogelijke boek(en) herkend. Controleer en bevestig de items hieronder.`
      );
    } catch (error: any) {
      console.error('Bookshelf analysis error:', error);
      Alert.alert(
        'Analyse mislukt',
        error?.message || 'Kon de foto niet analyseren. Voeg boeken handmatig toe.'
      );
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const confirmInventory = () => {
    const confirmedItems = detectedItems.filter(
      (item) => item.status === 'confirmed' || item.status === 'manual'
    );

    onItemsDetected(confirmedItems);

    Alert.alert(
      'Inventaris bevestigd! ✅',
      `${confirmedItems.length} items zijn toegevoegd aan je kast.`,
      [{ text: 'Geweldig!' }]
    );
  };

  const renderScanner = () => (
    <View style={styles.scannerSection}>
      <Text style={styles.sectionTitle}>📖 Boeken toevoegen aan je minibieb</Text>
      <Text style={styles.sectionDescription}>
        Scan ISBN barcodes, maak een foto van je boekenkast voor AI-herkenning, of voeg handmatig
        toe. Tip: horizontaal voor horizontale ruggen; voor verticale tekst draai je telefoon 90°.
      </Text>

      <TouchableOpacity
        style={[styles.photoScanButton, isAnalyzingPhoto && styles.photoScanButtonDisabled]}
        onPress={handleAnalyzeBookshelfPhoto}
        disabled={isAnalyzingPhoto}>
        {isAnalyzingPhoto ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.photoScanButtonText}>Foto boekenkast analyseren (AI)</Text>
          </>
        )}
      </TouchableOpacity>

      <BookScanner
        onBookScanned={handleBookScanned}
        onClose={() => {}} // No-op
      />
    </View>
  );

  const renderDetectedItems = () => (
    <View style={styles.itemsSection}>
      <Text style={styles.sectionTitle}>📚 Gedetecteerde items ({detectedItems.length})</Text>

      {detectedItems.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemAuthor}>{item.author}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
          </View>

          <View style={styles.itemActions}>
            {item.status === 'detected' && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setDetectedItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, status: 'confirmed' } : i))
                  );
                }}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.confirmText}>Bevestig</Text>
              </TouchableOpacity>
            )}

            {item.status === 'confirmed' && (
              <View style={styles.confirmedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.confirmedText}>Bevestigd</Text>
              </View>
            )}

            <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {detectedItems.length > 0 && (
        <TouchableOpacity style={styles.confirmAllButton} onPress={confirmInventory}>
          <Ionicons name="checkmark-done" size={20} color="#fff" />
          <Text style={styles.confirmAllText}>
            Bevestig alle items (
            {
              detectedItems.filter(
                (item) => item.status === 'confirmed' || item.status === 'manual'
              ).length
            }
            )
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderScanner()}
        {detectedItems.length > 0 && renderDetectedItems()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scannerSection: {
    marginBottom: 32,
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
    marginBottom: 16,
  },
  photoScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  photoScanButtonDisabled: {
    opacity: 0.7,
  },
  photoScanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  itemsSection: {
    marginBottom: 32,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemAuthor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  confirmText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  confirmAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  confirmAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
