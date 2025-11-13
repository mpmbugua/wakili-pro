import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { User } from '../../shared/types';

// Placeholder for update profile API
const updateProfile = async (user: User) => {
  // TODO: Integrate with backend API
  return Promise.resolve(user);
};

interface ProfileScreenProps {
  route: any;
}

export default function ProfileScreen({ route }: ProfileScreenProps) {
  const { user } = route.params;
  const [form, setForm] = useState<User>(user);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof User, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      Alert.alert('Profile updated successfully');
    } catch (e) {
      Alert.alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TextInput
        style={styles.input}
        value={form.firstName}
        onChangeText={text => handleChange('firstName', text)}
        placeholder="First Name"
      />
      <TextInput
        style={styles.input}
        value={form.lastName}
        onChangeText={text => handleChange('lastName', text)}
        placeholder="Last Name"
      />
      <TextInput
        style={styles.input}
        value={form.email}
        onChangeText={text => handleChange('email', text)}
        placeholder="Email"
        keyboardType="email-address"
      />
      {/* Add more fields as needed */}
      <Button title={loading ? 'Saving...' : 'Save'} onPress={handleSave} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 },
});
