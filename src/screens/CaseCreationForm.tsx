import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing } from '../design-system';

export const CaseCreationForm = ({ onSubmit }: any) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('civil');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function validateStep1() {
    if (!title) {
      setError('Title is required.');
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
      onSubmit({ title, type, date, description });
      Alert.alert('Success', 'Case created successfully.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Case</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {step === 1 && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Case Title"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.label}>Type</Text>
          <Picker
            selectedValue={type}
            onValueChange={setType}
            style={styles.picker}
          >
            <Picker.Item label="Civil" value="civil" />
            <Picker.Item label="Criminal" value="criminal" />
            <Picker.Item label="Family" value="family" />
            <Picker.Item label="Other" value="other" />
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
          <Text>Title: {title}</Text>
          <Text>Type: {type}</Text>
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