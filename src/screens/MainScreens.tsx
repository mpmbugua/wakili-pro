import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const DashboardScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Dashboard</Text>
    {/* Add dashboard content here */}
  </View>
);

export const AnalyticsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Analytics</Text>
    {/* Add analytics content here */}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
});
