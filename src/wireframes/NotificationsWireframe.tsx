import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

const notifications = [
  { id: '1', message: 'New case assigned', type: 'case_update' },
  { id: '2', message: 'Payment received', type: 'success' },
];

export const Notifications = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Notifications</Text>
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.notificationCard} accessibilityRole="alert" accessibilityLabel={item.message}>
          <Icon name={item.type === 'success' ? 'check-circle' : 'bell'} size={24} color={item.type === 'success' ? colors.success : colors.primary} />
          <Text style={styles.notificationText}>{item.message}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No notifications.</Text>}
      contentContainerStyle={{ flexGrow: 1 }}
      accessibilityLabel="List of notifications"
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
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  notificationText: {
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
});
