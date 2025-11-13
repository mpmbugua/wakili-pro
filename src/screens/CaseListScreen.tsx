import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { fetchCases } from '../../shared/caseApi';
import { Case } from '../../shared/caseTypes';

export default function CaseListScreen({ navigation, route }: any) {
  const { token } = route.params;
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCases(token);
        setCases(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load cases');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cases</Text>
      <Button title="Create New Case" onPress={() => navigation.navigate('CaseCreate', { token })} />
      <FlatList
        data={cases}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('CaseDetail', { token, caseId: item.id })}>
            <View style={styles.caseItem}>
              <Text style={styles.caseTitle}>{item.title}</Text>
              <Text>Status: {item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  caseItem: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  caseTitle: { fontSize: 18, fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
