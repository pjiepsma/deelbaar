import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import Colors from '~/constants/Colors';
import { useBookWishes, useCreateBookWish, useDeleteBookWish } from '~/lib/hooks/useBookWishes';
import { useAuth } from '~/lib/providers/AuthProvider';

interface BookWishlistProps {
  onClose: () => void;
  mode?: 'community' | 'personal';
}

export default function BookWishlist({ onClose, mode = 'community' }: BookWishlistProps) {
  const { user } = useAuth();
  const [isAddingWish, setIsAddingWish] = useState(false);
  const [newWish, setNewWish] = useState({
    title: '',
    author: '',
    description: '',
  });

  const { data: wishes, isLoading, error } = useBookWishes();
  const createWishMutation = useCreateBookWish();
  const deleteWishMutation = useDeleteBookWish();

  const isLoggedIn = !!user;

  const handleAddWish = async () => {
    if (!newWish.title.trim()) {
      Alert.alert('Titel verplicht', 'Geef een titel voor het gewenste boek.');
      return;
    }

    try {
      await createWishMutation.mutateAsync({
        title: newWish.title.trim(),
        author: newWish.author.trim() || undefined,
        description: newWish.description.trim() || undefined,
      });

      setNewWish({ title: '', author: '', description: '' });
      setIsAddingWish(false);

      Alert.alert('Wens toegevoegd! 📚', 'Je wens is toegevoegd aan de gemeenschappelijke lijst.');
    } catch (error) {
      Alert.alert('Fout', 'Kon wens niet toevoegen. Probeer het opnieuw.');
    }
  };

  const handleDeleteWish = (wishId: string, title: string) => {
    Alert.alert(
      'Wens verwijderen',
      `Weet je zeker dat je "${title}" wilt verwijderen uit je wensen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWishMutation.mutateAsync(wishId);
              Alert.alert('Verwijderd', 'Je wens is verwijderd.');
            } catch (error) {
              Alert.alert('Fout', 'Kon wens niet verwijderen.');
            }
          },
        },
      ]
    );
  };

  const renderAddWishForm = () => (
    <View style={styles.addForm}>
      <Text style={styles.formTitle}>📝 Boek wens toevoegen</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Titel *</Text>
        <Input
          style={styles.input}
          value={newWish.title}
          onChangeText={(text) => setNewWish((prev) => ({ ...prev, title: text }))}
          placeholder="Welk boek wil je graag lezen?"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Auteur (optioneel)</Text>
        <Input
          style={styles.input}
          value={newWish.author}
          onChangeText={(text) => setNewWish((prev) => ({ ...prev, author: text }))}
          placeholder="Wie heeft het geschreven?"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Waarom wil je dit boek? (optioneel)</Text>
        <Input
          style={[styles.input, styles.textArea]}
          value={newWish.description}
          onChangeText={(text) => setNewWish((prev) => ({ ...prev, description: text }))}
          placeholder="Waarom wil je dit boek lezen?"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formActions}>
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => {
            setIsAddingWish(false);
            setNewWish({ title: '', author: '', description: '' });
          }}>
          Annuleren
        </Button>

        <Button
          variant="primary"
          className="flex-1"
          onPress={handleAddWish}
          isDisabled={createWishMutation.isPending}>
          {createWishMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            'Toevoegen'
          )}
        </Button>
      </View>
    </View>
  );

  const renderWishesList = () => {
    // Filter wishes based on mode
    const filteredWishes =
      mode === 'personal'
        ? wishes?.filter((wish: any) => wish.user?.id === user?.id) || []
        : wishes || [];

    const isPersonalMode = mode === 'personal';

    return (
      <View style={styles.wishesList}>
        <Text style={styles.sectionTitle}>
          {isPersonalMode ? '❤️ Mijn wensen' : '📚 Gemeenschappelijke wensen'}
        </Text>
        <Text style={styles.sectionDescription}>
          {isPersonalMode
            ? 'Jouw persoonlijke boek wensen. Anderen kunnen zien wat je graag wilt lezen.'
            : isLoggedIn
              ? 'Boeken die mensen in de community graag willen lezen. Zie je een boek dat je kunt delen?'
              : 'Boeken die mensen in de community graag willen lezen. Log in om zelf wensen toe te voegen!'}
        </Text>

        {filteredWishes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {isPersonalMode ? 'Nog geen persoonlijke wensen' : 'Nog geen wensen'}
            </Text>
            <Text style={styles.emptyDescription}>
              {isPersonalMode
                ? 'Voeg je eerste boek wens toe!'
                : isLoggedIn
                  ? 'Wees de eerste die een boek wens toevoegt!'
                  : 'Log in om de eerste wens toe te voegen!'}
            </Text>
          </View>
        ) : (
          filteredWishes.map((wish: any) => (
            <View key={wish.id} style={styles.wishCard}>
              <View style={styles.wishContent}>
                <Text style={styles.wishTitle}>{wish.title}</Text>
                {wish.author && <Text style={styles.wishAuthor}>door {wish.author}</Text>}
                {wish.description && <Text style={styles.wishDescription}>{wish.description}</Text>}
                {!isPersonalMode && (
                  <Text style={styles.wishMeta}>
                    Gewenst door {wish.user?.name || wish.user?.email || 'Anoniem'}
                  </Text>
                )}
              </View>

              {isLoggedIn && wish.user?.id === user?.id && (
                <Button
                  isIconOnly
                  variant="tertiary"
                  style={styles.deleteButton}
                  onPress={() => handleDeleteWish(wish.id, wish.title)}>
                  <Ionicons name="trash" size={16} color="#ef4444" />
                </Button>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoggedIn && isAddingWish && mode === 'community'
          ? renderAddWishForm()
          : renderWishesList()}

        {/* Show add button at bottom for personal mode */}
        {mode === 'personal' && isLoggedIn && (
          <View style={styles.personalAddSection}>
            <Button
              isIconOnly
              variant="primary"
              style={styles.floatingAddButton}
              onPress={() => setIsAddingWish(!isAddingWish)}>
              <Ionicons name={isAddingWish ? 'close' : 'add'} size={24} color="#fff" />
            </Button>
          </View>
        )}

        {/* Show add form at bottom for personal mode */}
        {isLoggedIn && isAddingWish && mode === 'personal' && (
          <View style={styles.addFormContainer}>{renderAddWishForm()}</View>
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
    height: 80,
    textAlignVertical: 'top',
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
  wishesList: {
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
  wishCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wishContent: {
    flex: 1,
  },
  wishTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  wishAuthor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  wishDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  wishMeta: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  personalAddSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  floatingAddButton: {
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addFormContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});
