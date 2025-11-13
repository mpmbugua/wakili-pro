import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Alert } from 'react-native';
import { uploadDocument } from '../../shared/documentApi';

// Document picker functionality removed
export default function DocumentUploadScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState(''); // Simulate file URL
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    try {
      // Simulate FormData for file upload
      const formData = new FormData();
      formData.append('fileName', fileName);
      formData.append('fileUrl', fileUrl); // In real app, append file object
      formData.append('description', description);
      await uploadDocument(token, formData);
      Alert.alert('Document uploaded successfully');
      navigation.goBack();
    } catch {
      Alert.alert('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Document</Text>
      <TextInput
        style={styles.input}
        value={fileName}
        onChangeText={setFileName}
        placeholder="File Name"
      />
      <TextInput
        style={styles.input}
        value={fileUrl}
        onChangeText={setFileUrl}
        placeholder="File URL (simulate)"
      />
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
      />
      <Button title={loading ? 'Uploading...' : 'Upload'} onPress={handleUpload} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 },
});
