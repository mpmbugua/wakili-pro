import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { fetchCaseById, updateCase } from '../../shared/caseApi';
import { Case } from '../../shared/caseTypes';

export default function CaseEditScreen({ route, navigation }: any) {
  const { token, caseId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchCaseById(token, caseId);
        setTitle(data.title);
        setDescription(data.description);
      } catch (e) {
        Alert.alert('Failed to load case');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, caseId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCase(token, caseId, { title, description });
      Alert.alert('Case updated successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Case</Text>
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
      <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 },
});
