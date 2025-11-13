import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createCase } from '../../shared/caseApi';
import { Case } from '../../shared/caseTypes';

export default function CaseCreateScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const newCase = await createCase(token, { title, description });
      Alert.alert('Case created successfully');
      navigation.replace('CaseDetail', { token, caseId: newCase.id });
    } catch (e) {
      Alert.alert('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Case</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
      />
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
      />
      <Button title={loading ? 'Creating...' : 'Create Case'} onPress={handleCreate} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 },
});
