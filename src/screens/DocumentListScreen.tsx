import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Button, Linking } from 'react-native';
import { fetchDocuments } from '../../shared/documentApi';
import { LegalDocument } from '../../shared/documentTypes';

export default function DocumentListScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDocuments(token);
        setDocuments(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load documents');
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
      <Text style={styles.title}>Documents</Text>
      <Button title="Upload Document" onPress={() => navigation.navigate('DocumentUpload', { token })} />
      <FlatList
        data={documents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl)}>
            <View style={styles.documentItem}>
              <Text style={styles.documentTitle}>{item.fileName}</Text>
              <Text>Uploaded: {item.uploadedAt}</Text>
              <Text>{item.description}</Text>
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
  documentItem: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  documentTitle: { fontSize: 16, fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
