import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

import Colors from '~/constants/Colors';

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

interface BookDetailViewProps {
  inventory: InventoryItem[];
  onBorrowRequest?: (bookId: string) => void;
  onClose: () => void;
}

export default function BookDetailView({
  inventory,
  onBorrowRequest,
  onClose,
}: BookDetailViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(inventory.map((item) => item.category)))];

  const filteredInventory =
    selectedCategory === 'all'
      ? inventory
      : inventory.filter((item) => item.category === selectedCategory);

  const handleBorrowRequest = (bookId: string) => {
    const book = inventory.find((item) => item.id === bookId);
    if (book) {
      Alert.alert(
        'Boek lenen aanvragen',
        `Wil je "${book.title}"${book.author ? ` van ${book.author}` : ''} lenen?`,
        [
          { text: 'Annuleren', style: 'cancel' },
          {
            text: 'Aanvragen',
            onPress: () => onBorrowRequest?.(bookId),
          },
        ]
      );
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'Literatuur':
        return '📚 Literatuur';
      case 'Non-fictie':
        return '📖 Non-fictie';
      case 'Humor':
        return '😂 Humor';
      case 'Kinderboeken':
        return '🧸 Kinderboeken';
      case 'Thriller':
        return '🔪 Thriller';
      case 'Roman':
        return '💕 Roman';
      case 'Wetenschap':
        return '🔬 Wetenschap';
      case 'Kookboek':
        return '👨‍🍳 Kookboek';
      default:
        return `📖 ${category}`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 Boeken in deze minibieb</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {inventory.length} boek{inventory.length !== 1 ? 'en' : ''} beschikbaar
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal style={styles.categoryFilter} showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(category)}>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextSelected,
              ]}>
              {category === 'all' ? 'Alle boeken' : getCategoryDisplayName(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Book List */}
      <ScrollView style={styles.bookList} showsVerticalScrollIndicator={false}>
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen boeken gevonden</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === 'all'
                ? 'Deze minibieb heeft nog geen boeken toegevoegd.'
                : `Geen boeken in de categorie "${selectedCategory}".`}
            </Text>
          </View>
        ) : (
          filteredInventory.map((book) => (
            <View key={book.id} style={styles.bookCard}>
              <View style={styles.bookHeader}>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  {book.author && <Text style={styles.bookAuthor}>door {book.author}</Text>}
                  <View style={styles.bookMeta}>
                    <Text style={styles.bookCategory}>{getCategoryDisplayName(book.category)}</Text>
                    {book.confidence < 0.8 && (
                      <Text style={styles.confidenceText}>
                        ~{Math.round(book.confidence * 100)}% zeker
                      </Text>
                    )}
                  </View>
                </View>

                {book.imageUri && (
                  <View style={styles.bookImageContainer}>
                    {/* Placeholder for book cover */}
                    <View style={styles.bookImage}>
                      <Ionicons name="book" size={24} color="#666" />
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.bookActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.borrowButton]}
                  onPress={() => handleBorrowRequest(book.id)}>
                  <Ionicons name="hand-left" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Lenen aanvragen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.infoButton]}
                  onPress={() => {
                    // Show more details
                    Alert.alert(
                      book.title,
                      `${book.author ? `Auteur: ${book.author}\n` : ''}Categorie: ${book.category}${book.isbn ? `\nISBN: ${book.isbn}` : ''}`,
                      [{ text: 'OK' }]
                    );
                  }}>
                  <Ionicons name="information-circle" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
  stats: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryFilter: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  bookList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bookCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookCategory: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  confidenceText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  bookImageContainer: {
    marginLeft: 16,
  },
  bookImage: {
    width: 60,
    height: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  borrowButton: {
    backgroundColor: Colors.primary,
  },
  infoButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookDetailView;
