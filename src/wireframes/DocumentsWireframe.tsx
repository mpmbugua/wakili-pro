import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

const documents = [
  { id: '1', name: 'Contract.pdf', type: 'pdf' },
  { id: '2', name: 'Evidence.jpg', type: 'image' },
];

export const Documents = ({ onUpload, onSelect }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Documents</Text>
    <FlatList
      data={documents}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.docCard} onPress={() => onSelect(item)} accessibilityRole="button" accessibilityLabel={`View ${item.name}`}>
          <Icon name={item.type === 'pdf' ? 'file-pdf' : 'file-image'} size={24} color={colors.primary} />
          <Text style={styles.docName}>{item.name}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No documents found.</Text>}
      contentContainerStyle={{ flexGrow: 1 }}
      accessibilityLabel="List of documents"
    />
    <TouchableOpacity style={styles.uploadBtn} onPress={onUpload} accessibilityRole="button" accessibilityLabel="Upload Document">
      <Icon name="upload" size={28} color={colors.secondary} />
      <Text style={styles.uploadText}>Upload Document</Text>
    </TouchableOpacity>
  </View>
);

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
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  docName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.lg,
    elevation: 1,
  },
  uploadText: {
    ...typography.body,
    color: colors.secondary,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
});
