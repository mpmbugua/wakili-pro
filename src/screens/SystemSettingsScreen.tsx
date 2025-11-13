import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SystemSettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Settings</Text>
      <Text>Configure system-wide settings here (to be implemented).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
});
