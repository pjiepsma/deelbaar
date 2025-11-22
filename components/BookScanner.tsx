import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '~/constants/Colors';
import type { BookData } from '~/lib/types/book';

type BookScannerProps = {
  onBookScanned: (book: BookData) => void;
  onClose: () => void;
};

export default function BookScanner({ onBookScanned, onClose }: BookScannerProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Manual input fields
  const [manualBook, setManualBook] = useState({
    title: '',
    author: '',
    isbn: '',
  });

  const handleManualSubmit = async () => {
    if (!manualBook.title.trim()) {
      Alert.alert('Titel verplicht', 'Geef minimaal een titel voor het boek.');
      return;
    }

    setIsLoading(true);

    try {
      // Try to look up book by title/author if ISBN is provided
      let bookData: BookData;

      if (manualBook.isbn.trim()) {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${manualBook.isbn}`
        );
        const result = await response.json();

        if (result.items && result.items.length > 0) {
          const book = result.items[0].volumeInfo;
          bookData = {
            id: book.id || `manual-${Date.now()}`,
            title: book.title,
            authors: book.authors,
            publisher: book.publisher,
            publishedDate: book.publishedDate,
            description: book.description,
            pageCount: book.pageCount,
            categories: book.categories,
            imageLinks: book.imageLinks,
            isbn: manualBook.isbn,
          };
        } else {
          // Fallback to manual input
          bookData = {
            id: `manual-${Date.now()}`,
            title: manualBook.title.trim(),
            authors: manualBook.author.trim() ? [manualBook.author.trim()] : undefined,
            isbn: manualBook.isbn.trim() || undefined,
          };
        }
      } else {
        // Pure manual input
        bookData = {
          id: `manual-${Date.now()}`,
          title: manualBook.title.trim(),
          authors: manualBook.author.trim() ? [manualBook.author.trim()] : undefined,
          isbn: manualBook.isbn.trim() || undefined,
        };
      }

      onBookScanned(bookData);
    } catch (error) {
      Alert.alert('Fout', 'Er ging iets mis bij het toevoegen van het boek.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boek toevoegen</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Voer de boekgegevens handmatig in. ISBN is optioneel maar helpt bij het vinden van meer
          informatie.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Titel *</Text>
          <TextInput
            style={styles.input}
            value={manualBook.title}
            onChangeText={(text) => setManualBook((prev) => ({ ...prev, title: text }))}
            placeholder="Voer de titel in"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Auteur (optioneel)</Text>
          <TextInput
            style={styles.input}
            value={manualBook.author}
            onChangeText={(text) => setManualBook((prev) => ({ ...prev, author: text }))}
            placeholder="Voer de auteur in"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ISBN (optioneel)</Text>
          <TextInput
            style={styles.input}
            value={manualBook.isbn}
            onChangeText={(text) => setManualBook((prev) => ({ ...prev, isbn: text }))}
            placeholder="Voer de ISBN in"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuleren</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleManualSubmit}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Toevoegen</Text>
            )}
          </TouchableOpacity>
        </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
});
