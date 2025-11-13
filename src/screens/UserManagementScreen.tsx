import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UserManagementScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      <Text>List, add, edit, and remove users here (to be implemented).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
});
