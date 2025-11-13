import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { User, AnalyticsData } from '../../shared/types';

interface DashboardScreenProps {
  route: any;
  navigation: any;
}

export default function DashboardScreen({ route, navigation }: DashboardScreenProps) {
  const { user, analytics, token, onLogout } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.firstName || ''}!</Text>
      <Text style={styles.subtitle}>Role: {user?.role || ''}</Text>
      <View style={styles.metrics}>
        <Text>Total Bookings: {analytics?.totalBookings ?? '-'}</Text>
        <Text>Total Revenue: {analytics?.totalRevenue ?? '-'}</Text>
        <Text>Active Consultations: {analytics?.activeConsultations ?? '-'}</Text>
        <Text>Completed Services: {analytics?.completedServices ?? '-'}</Text>
        <Text>Average Rating: {analytics?.averageRating ?? '-'}</Text>
      </View>
      <Button title="View Analytics" onPress={() => navigation.navigate('Analytics', { token })} />
      <Button title="Profile" onPress={() => navigation.navigate('Profile', { user })} />
      <Button title="Logout" onPress={onLogout} color="#d9534f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 24 },
  metrics: { marginBottom: 32, alignItems: 'flex-start', width: '100%' },
});
