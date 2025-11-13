import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchCaseById } from '../../shared/caseApi';
import { Case } from '../../shared/caseTypes';

export default function CaseDetailScreen({ route, navigation }: any) {
  const { token, caseId } = route.params;
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCaseById(token, caseId);
        setCaseData(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load case');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, caseId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!caseData) return <Text>No case data found.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{caseData.title}</Text>
      <Text>Status: {caseData.status}</Text>
      <Text>Description: {caseData.description}</Text>
      <Text>Created: {caseData.createdAt}</Text>
      <Text>Updated: {caseData.updatedAt}</Text>
      <Button title="Edit Case" onPress={() => navigation.navigate('CaseEdit', { token, caseId })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
