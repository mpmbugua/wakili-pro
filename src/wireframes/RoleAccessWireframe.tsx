import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

const users = [
  { id: '1', name: 'Client A', role: 'client' },
  { id: '2', name: 'Lawyer B', role: 'lawyer' },
];

export const RoleAccess = ({ onUpdateRole }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Role-Based Access</Text>
    <FlatList
      data={users}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.userCard} accessibilityRole="none" accessibilityLabel={`${item.name}, ${item.role}`}>
          <Icon name={item.role === 'lawyer' ? 'account-tie' : 'account'} size={24} color={colors.primary} />
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userRole}>{item.role}</Text>
          <TouchableOpacity style={styles.updateBtn} onPress={() => onUpdateRole(item)} accessibilityRole="button" accessibilityLabel={`Update role for ${item.name}`}>
            <Icon name="account-edit" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
      contentContainerStyle={{ flexGrow: 1 }}
      accessibilityLabel="List of users and roles"
    />
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  userName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  userRole: {
    ...typography.caption,
    color: colors.secondary,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
  updateBtn: {
    marginLeft: 'auto',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.xs,
    elevation: 1,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
