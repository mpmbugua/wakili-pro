import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export const CaseCreateScreen = ({ navigation }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Create Case</Text>
    {/* Add form fields for case creation here */}
    <Button title="Save" onPress={() => navigation.goBack()} />
  </View>
);

export const CaseEditScreen = ({ navigation }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Edit Case</Text>
    {/* Add form fields for case editing here */}
    <Button title="Update" onPress={() => navigation.goBack()} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
});
