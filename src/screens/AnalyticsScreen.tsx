import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { fetchAnalytics } from '../../shared/api';
import { AnalyticsData } from '../../shared/types';

export default function AnalyticsScreen({ route }: any) {
  const { token } = route.params;
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnalytics(token);
        setAnalytics(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!analytics) return <Text>No analytics data available.</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Analytics Overview</Text>
      <Text>Total Bookings: {analytics.totalBookings}</Text>
      <Text>Total Revenue: {analytics.totalRevenue}</Text>
      <Text>Active Consultations: {analytics.activeConsultations}</Text>
      <Text>Completed Services: {analytics.completedServices}</Text>
      <Text>Average Rating: {analytics.averageRating}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
