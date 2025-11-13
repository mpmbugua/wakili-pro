import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

const cases = [
  { id: '1', title: 'Case A', status: 'Open' },
  { id: '2', title: 'Case B', status: 'Closed' },
];

export const Cases = ({ onCreate, onSelect }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Cases</Text>
    <FlatList
      data={cases}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.caseCard} onPress={() => onSelect(item)} accessibilityRole="button" accessibilityLabel={`View ${item.title}`}>
          <Icon name="folder-account" size={24} color={colors.primary} />
          <View style={{ marginLeft: spacing.md }}>
            <Text style={styles.caseTitle}>{item.title}</Text>
            <Text style={styles.caseStatus}>{item.status}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No cases found.</Text>}
      contentContainerStyle={{ flexGrow: 1 }}
      accessibilityLabel="List of cases"
    />
    <TouchableOpacity style={styles.createBtn} onPress={onCreate} accessibilityRole="button" accessibilityLabel="Create New Case">
      <Icon name="plus-circle" size={28} color={colors.secondary} />
      <Text style={styles.createText}>Create New Case</Text>
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
  caseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  caseTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  caseStatus: {
    ...typography.caption,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.lg,
    elevation: 1,
  },
  createText: {
    ...typography.body,
    color: colors.secondary,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
});
