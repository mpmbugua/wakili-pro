import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createAppointment } from '../../shared/calendarApi';

export default function AppointmentCreateScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createAppointment(token, { title, description, start, end });
      Alert.alert('Appointment created successfully');
      navigation.goBack();
    } catch {
      Alert.alert('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Appointment</Text>
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
      />
      <TextInput
        style={styles.input}
        value={start}
        onChangeText={setStart}
        placeholder="Start (YYYY-MM-DD HH:mm)"
      />
      <TextInput
        style={styles.input}
        value={end}
        onChangeText={setEnd}
        placeholder="End (YYYY-MM-DD HH:mm)"
      />
      <Button title={loading ? 'Creating...' : 'Create Appointment'} onPress={handleCreate} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 },
});
