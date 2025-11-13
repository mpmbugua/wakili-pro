import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { fetchAppointments } from '../../shared/calendarApi';
import { Appointment } from '../../shared/calendarTypes';

export default function AppointmentListScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAppointments(token);
        setAppointments(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load appointments');
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
      <Text style={styles.title}>Appointments</Text>
      <Button title="Create Appointment" onPress={() => navigation.navigate('AppointmentCreate', { token })} />
      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentDetail', { token, appointmentId: item.id })}>
            <View style={styles.appointmentItem}>
              <Text style={styles.appointmentTitle}>{item.title}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Start: {item.start}</Text>
              <Text>End: {item.end}</Text>
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
  appointmentItem: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  appointmentTitle: { fontSize: 16, fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
