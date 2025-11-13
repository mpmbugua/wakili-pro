import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, TextInput } from 'react-native';
import { User } from '../../shared/types';
// Assume fetchUserProfile and updateUserProfile are implemented in shared/api.ts

export const ProfileScreen = ({ navigation, route }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const token = route?.params?.token;

  useEffect(() => {
    async function loadProfile() {
      try {
        // Replace with actual API call
        // const data = await fetchUserProfile(token);
        // setUser(data);
        setUser({ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'client' });
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user && (
        <>
          <Text>Name: {user.firstName} {user.lastName}</Text>
          <Text>Email: {user.email}</Text>
          <Text>Role: {user.role}</Text>
        </>
      )}
      <Button title="Edit Profile" onPress={() => navigation.navigate('ProfileEdit', { user })} />
    </View>
  );
};

export const ProfileEditScreen = ({ navigation, route }: any) => {
  const user = route?.params?.user;
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      // Replace with actual API call
      // await updateUserProfile(token, { firstName, lastName, email });
      navigation.goBack();
    } catch (e) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <Button title={loading ? 'Saving...' : 'Save'} onPress={handleSave} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8, borderRadius: 4 },
});
