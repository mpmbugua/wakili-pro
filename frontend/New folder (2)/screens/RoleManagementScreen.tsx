import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { updateUserRole } from '../../shared/userApi';

export const RoleManagementScreen = ({ navigation, route }: any) => {
  const token = route?.params?.token;
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'client' | 'lawyer' | 'admin'>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (!userId) {
      setError('User ID is required.');
      return false;
    }
    if (!role) {
      setError('Role is required.');
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateUserRole(token, userId, role);
      Alert.alert('Success', 'User role updated successfully.');
      navigation.goBack();
    } catch (e) {
      setError('Failed to update user role.');
      Alert.alert('Error', 'Failed to update user role.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update User Role</Text>
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="User ID"
        value={userId}
        onChangeText={setUserId}
      />
      <Text style={{ marginTop: 8 }}>Role:</Text>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {['client', 'lawyer', 'admin'].map(r => (
          <Button
            key={r}
            title={r.charAt(0).toUpperCase() + r.slice(1)}
            onPress={() => setRole(r as any)}
            color={role === r ? '#007AFF' : undefined}
          />
        ))}
      </View>
      <Button title={loading ? 'Updating...' : 'Update Role'} onPress={handleSubmit} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});