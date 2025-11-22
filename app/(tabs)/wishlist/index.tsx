import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookWishlist from '~/components/BookWishlist';
import { useAuth } from '~/lib/providers/AuthProvider';

export default function WishlistScreen() {
  const [activeTab, setActiveTab] = useState<'community' | 'personal'>('community');
  const { user } = useAuth();

  const handleClose = () => {
    // In tab navigator, we don't close - just stay on the tab
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Boek wensen</Text>
      </View>

      {/* Tab Navigator */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.activeTab]}
          onPress={() => setActiveTab('community')}>
          <Ionicons
            name="people"
            size={16}
            color={activeTab === 'community' ? '#fff' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'community' && styles.activeTabText]}>
            Gemeenschap
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
          disabled={!user}>
          <Ionicons name="heart" size={16} color={activeTab === 'personal' ? '#fff' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            Mijn wensen
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'community' ? (
          <BookWishlist onClose={handleClose} mode="community" />
        ) : (
          <BookWishlist onClose={handleClose} mode="personal" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
});
