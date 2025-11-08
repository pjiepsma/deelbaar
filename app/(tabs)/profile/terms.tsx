import { ScrollView, StyleSheet, Text } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Voorwaarden & beleid</Text>
      <Text style={styles.body}>
        We werken aan toegankelijke community-richtlijnen en privacydocumentatie. Tot die tijd gelden onze
        algemene voorwaarden: wees vriendelijk, deel met respect en meld misbruik via support@deelbaar.nl.
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


