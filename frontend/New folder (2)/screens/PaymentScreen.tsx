import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { createInvoice } from '../../shared/billingApi';

export const PaymentScreen = ({ navigation, route }: any) => {
  const token = route?.params?.token;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount.');
      return false;
    }
    if (!description) {
      setError('Description is required.');
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await createInvoice(token, { amount: Number(amount), description });
      Alert.alert('Success', 'Invoice created successfully.');
      navigation.goBack();
    } catch (e) {
      setError('Failed to create invoice.');
      Alert.alert('Error', 'Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Payment Invoice</Text>
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <Button title={loading ? 'Submitting...' : 'Submit'} onPress={handleSubmit} disabled={loading} />
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
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});