import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function AdminDashboardScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Button title="User Management" onPress={() => navigation.navigate('UserManagement')} />
      <Button title="System Analytics" onPress={() => navigation.navigate('SystemAnalytics')} />
      <Button title="System Settings" onPress={() => navigation.navigate('SystemSettings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
});
