import { ScrollView, StyleSheet, Text } from 'react-native';

export default function AdminScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Admin tools</Text>
      <Text style={styles.body}>
        Moderatietaken en beheerdersfuncties keren hier terug. Denk aan het keuringspaneel voor
        foto’s, het beheren van pending listings en het monitoren van community-activiteit.
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
