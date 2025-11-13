import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing } from '../design-system';

export const PaymentForm = ({ onSubmit }: any) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function validateStep1() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount.');
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep2() {
    if (!description) {
      setError('Description is required.');
      return false;
    }
    setError(null);
    return true;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function handleSubmit() {
    if (validateStep2()) {
      onSubmit({ amount: Number(amount), method, date, description });
      Alert.alert('Success', 'Payment submitted successfully.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Make Payment</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {step === 1 && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.label}>Method</Text>
          <Picker
            selectedValue={method}
            onValueChange={setMethod}
            style={styles.picker}
          >
            <Picker.Item label="Card" value="card" />
            <Picker.Item label="Bank" value="bank" />
            <Picker.Item label="Cash" value="cash" />
          </Picker>
          <Button title="Next" onPress={handleNext} />
        </>
      )}
      {step === 2 && (
        <>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(_: any, selectedDate: Date | undefined) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button title="Next" onPress={handleNext} />
        </>
      )}
      {step === 3 && (
        <>
          <Text style={styles.label}>Review</Text>
          <Text>Amount: {amount}</Text>
          <Text>Method: {method}</Text>
          <Text>Date: {date.toDateString()}</Text>
          <Text>Description: {description}</Text>
          <Button title="Submit" onPress={handleSubmit} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
});