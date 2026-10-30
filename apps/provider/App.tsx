import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

const sections = [
  {
    "title": "Get verified",
    "description": "Create your profile and submit qualifications."
  },
  {
    "title": "Manage requests",
    "description": "Receive and accept matching service requests."
  },
  {
    "title": "Track earnings",
    "description": "Review completed work and payment history."
  }
];

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fd" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>HOME SERVICES</Text>
          <Text style={styles.phase}>PHASE 01</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PROFESSIONAL WORKSPACE</Text>
          <Text style={styles.heading}>Your work, organized.</Text>
          <Text style={styles.description}>
            Accept jobs that match your skills and availability, then manage each assignment from arrival to completion.
          </Text>
        </View>
        <Text style={styles.sectionHeading}>Coming in the next phases</Text>
        {sections.map((section, index) => (
          <View key={section.title} style={styles.card}>
            <View style={styles.number}>
              <Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardDescription}>{section.description}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.footer}>App foundation initialized. No live services are enabled yet.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f8fd' },
  content: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 56 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#1f3455', fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  phase: { color: '#4f46e5', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  hero: { marginTop: 82, marginBottom: 44 },
  eyebrow: { color: '#4f46e5', fontSize: 12, fontWeight: '700', letterSpacing: 1.6 },
  heading: { fontSize: 38, fontWeight: '800', lineHeight: 46, color: '#152743', marginTop: 13 },
  description: { fontSize: 16, lineHeight: 26, color: '#66778f', marginTop: 18 },
  sectionHeading: { fontWeight: '800', fontSize: 18, color: '#243853', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 17,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5ebf4',
  },
  number: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#eaf1fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  numberText: { fontSize: 12, fontWeight: '800', color: '#4f46e5' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#172942' },
  cardDescription: { fontSize: 13, color: '#687b92', lineHeight: 20, marginTop: 5 },
  footer: { fontSize: 12, color: '#8392a8', lineHeight: 20, marginTop: 28, textAlign: 'center' },
});
