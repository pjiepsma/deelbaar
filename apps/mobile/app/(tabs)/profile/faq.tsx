import { ScrollView, StyleSheet, Text } from 'react-native';

export default function FaqScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Veelgestelde vragen</Text>
      <Text style={styles.body}>
        We werken aan een uitgebreide FAQ voor Deelbaar. Tot die tijd kun je terecht op
        support@deelbaar.nl met al je vragen over minibiebs, watertappunten en community-functies.
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







