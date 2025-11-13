import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { fetchCases } from '../../shared/caseApi';
import { Case } from '../../shared/caseTypes';

export const CaseListScreen = ({ navigation, route }: any) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const token = route?.params?.token;

  useEffect(() => {
    async function loadCases() {
      try {
        const data = await fetchCases(token);
        setCases(data);
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cases</Text>
      <FlatList
        data={cases}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('CaseDetail', { token, caseId: item.id })}>
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text>Status: {item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <Button title="Create New Case" onPress={() => navigation.navigate('CaseCreate', { token })} />
    </View>
  );
};

export const CaseDetailScreen = ({ route }: any) => {
  const { token, caseId } = route.params;
  // You can fetch case details here using fetchCaseById
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Case Details</Text>
      <Text>Case ID: {caseId}</Text>
      {/* Show more case details here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemTitle: { fontWeight: 'bold', fontSize: 18 },
});
