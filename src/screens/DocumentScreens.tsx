import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// import DocumentPicker from 'react-native-document-picker';
import { fetchDocuments, uploadDocument } from '../../shared/documentApi';
import { LegalDocument } from '../../shared/documentTypes';

export const DocumentListScreen = ({ navigation, route }: any) => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const token = route?.params?.token;

  useEffect(() => {
    async function loadDocuments() {
      try {
        const data = await fetchDocuments(token);
        setDocuments(data);
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      <FlatList
        data={documents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.fileName}</Text>
              <Text>Uploaded: {item.uploadedAt}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <Button title="Upload Document" onPress={() => navigation.navigate('DocumentUpload', { token })} />
    </View>
  );
};

export const DocumentUploadScreen = ({ navigation, route }: any) => {
  const token = route?.params?.token;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Document picker functionality removed
  async function handlePickDocument() {
    setError('Document picker functionality is not available.');
    Alert.alert('Error', 'Document picker functionality is not available.');
  }

  async function handleUpload(file: any) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
      await uploadDocument(token, formData);
      Alert.alert('Success', 'Document uploaded successfully.');
      navigation.goBack();
    } catch (e) {
      setError('Failed to upload document.');
      Alert.alert('Error', 'Failed to upload document.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Document</Text>
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      {fileName && <Text>Selected: {fileName}</Text>}
      <Button title={loading ? 'Uploading...' : 'Pick Document'} onPress={handlePickDocument} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemTitle: { fontWeight: 'bold', fontSize: 18 },
});
