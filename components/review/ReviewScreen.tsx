import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Rating } from 'react-native-elements';

// Mock data for reviews
const reviews = [
  {
    id: '1',
    user: 'D Verzo',
    rating: 5,
    date: 'a month ago',
    text: 'We went here camping with school, a very long time ago...',
    relevance: 5,
  },
  {
    id: '2',
    user: 'A Smith',
    rating: 4,
    date: '2 months ago',
    text: 'Nice restaurant with good service...',
    relevance: 3,
  },
  {
    id: '3',
    user: 'J Doe',
    rating: 3,
    date: '3 months ago',
    text: 'Average experience, nothing special...',
    relevance: 4,
  },
];

// Sorting options
const SORT_OPTIONS = ['Most relevant', 'Newest', 'Highest', 'Lowest'];

const ReviewsScreen = () => {
  const [selectedSort, setSelectedSort] = useState('Most relevant');
  const [sortedReviews, setSortedReviews] = useState(reviews);

  // Sort reviews when the sort option changes
  const handleSortChange = (option) => {
    setSelectedSort(option);
    let sorted;
    switch (option) {
      case 'Newest':
        sorted = [...reviews].sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'Highest':
        sorted = [...reviews].sort((a, b) => b.rating - a.rating);
        break;
      case 'Lowest':
        sorted = [...reviews].sort((a, b) => a.rating - b.rating);
        break;
      default: // Most relevant
        sorted = [...reviews].sort((a, b) => b.relevance - a.relevance);
    }
    setSortedReviews(sorted);
  };

  // Render each review
  const renderReview = ({ item }) => (
    <View style={styles.reviewContainer}>
      <Text style={styles.userName}>{item.user}</Text>
      <Rating imageSize={20} readonly startingValue={item.rating} style={styles.rating} />
      <Text style={styles.date}>{item.date}</Text>
      <Text style={styles.reviewText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Sort by section */}
      <View style={styles.sortContainer}>
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortButton, selectedSort === option && styles.selectedSortButton]}
            onPress={() => handleSortChange(option)}>
            <Text style={{ color: selectedSort === option ? 'white' : 'black' }}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List of reviews */}
      <FlatList data={sortedReviews} keyExtractor={(item) => item.id} renderItem={renderReview} />
    </View>
  );
};

const styles = StyleSheet.create({
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  sortButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  selectedSortButton: {
    backgroundColor: '#007bff',
  },
  reviewContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  rating: {
    marginVertical: 5,
  },
  date: {
    color: '#666',
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 14,
  },
});

export default ReviewsScreen;
