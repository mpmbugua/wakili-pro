import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { User } from '../../shared/types';

export const RoleAccessScreen = () => {
  // Example users and roles
  const [selectedRole, setSelectedRole] = useState<'client' | 'lawyer' | 'admin'>('client');
  const [user, setUser] = useState<User>({ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'client' });

  function handleRoleChange(role: 'client' | 'lawyer' | 'admin') {
    setSelectedRole(role);
    setUser({ ...user, role });
    // Here you would call an API to update the user's role
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Role-Based Access</Text>
      <Text>User: {user.firstName} {user.lastName}</Text>
      <Text>Email: {user.email}</Text>
      <Text>Current Role: {user.role}</Text>
      <Picker
        selectedValue={selectedRole}
        style={styles.picker}
        onValueChange={handleRoleChange}
      >
        <Picker.Item label="Client" value="client" />
        <Picker.Item label="Lawyer" value="lawyer" />
        <Picker.Item label="Admin" value="admin" />
      </Picker>
      <Button title="Update Role" onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  picker: { height: 50, width: 200, marginBottom: 16 },
});
