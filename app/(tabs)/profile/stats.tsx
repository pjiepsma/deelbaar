import { ScrollView, StyleSheet, Text } from 'react-native';

export default function StatsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Statistieken</Text>
      <Text style={styles.body}>
        Binnenkort zie je hier inzichten over views, favoriete plaatsen en bijdragen uit de community.
        We verzamelen de data al, zodat we straks mooie grafieken kunnen tonen.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  body: {
    color: '#4B5563',
    lineHeight: 22,
  },
});


