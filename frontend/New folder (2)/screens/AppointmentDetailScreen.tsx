import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { fetchAppointments, updateAppointment } from '../../shared/calendarApi';
import { Appointment } from '../../shared/calendarTypes';

export default function AppointmentDetailScreen({ route, navigation }: any) {
  const { token, appointmentId } = route.params;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAppointments(token);
        const found = data.find((a: Appointment) => a.id === appointmentId);
        setAppointment(found || null);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, appointmentId]);

  const handleComplete = async () => {
    if (!appointment) return;
    try {
      await updateAppointment(token, appointment.id, { status: 'completed' });
      Alert.alert('Appointment marked as completed');
      navigation.goBack();
    } catch {
      Alert.alert('Failed to update appointment');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!appointment) return <Text>No appointment data found.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{appointment.title}</Text>
      <Text>Status: {appointment.status}</Text>
      <Text>Start: {appointment.start}</Text>
      <Text>End: {appointment.end}</Text>
      <Text>Description: {appointment.description}</Text>
      <Button title="Mark as Completed" onPress={handleComplete} disabled={appointment.status === 'completed'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
