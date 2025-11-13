import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { fetchAppointments, createAppointment } from '../../shared/calendarApi';
import { Appointment } from '../../shared/calendarTypes';

export const CalendarScreen = ({ navigation, route }: any) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const token = route?.params?.token;

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await fetchAppointments(token);
        setAppointments(data);
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>
      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <View style={styles.item}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text>{item.start} - {item.end}</Text>
              <Text>Status: {item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <Button title="Add Event" onPress={() => navigation.navigate('EventCreate', { token })} />
    </View>
  );
};

export const EventCreateScreen = ({ navigation, route }: any) => {
  const token = route?.params?.token;
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (!title.trim()) return 'Title is required.';
    if (!start.trim()) return 'Start date/time is required.';
    if (!end.trim()) return 'End date/time is required.';
    // Add more validation as needed
    return null;
  }

  async function handleCreate() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      Alert.alert('Validation Error', validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createAppointment(token, { title, start, end, status: 'scheduled', userId: 'me' });
      navigation.goBack();
    } catch (e) {
      setError('Failed to create event.');
      Alert.alert('Error', 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Event</Text>
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Start (YYYY-MM-DD HH:mm)" value={start} onChangeText={setStart} />
      <TextInput style={styles.input} placeholder="End (YYYY-MM-DD HH:mm)" value={end} onChangeText={setEnd} />
      <Button title={loading ? 'Saving...' : 'Save Event'} onPress={handleCreate} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemTitle: { fontWeight: 'bold', fontSize: 18 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8, borderRadius: 4 },
});
