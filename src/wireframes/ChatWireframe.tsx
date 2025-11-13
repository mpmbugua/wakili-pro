import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

const threads = [
  { id: '1', name: 'Client A', lastMessage: 'See you tomorrow', unread: true },
  { id: '2', name: 'Lawyer B', lastMessage: 'Document received', unread: false },
];

export const Chat = ({ onOpenThread }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Chat</Text>
    <FlatList
      data={threads}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.threadCard} onPress={() => onOpenThread(item)} accessibilityRole="button" accessibilityLabel={`Open chat with ${item.name}`}>
          <Icon name="account-circle" size={24} color={colors.primary} />
          <View style={{ marginLeft: spacing.md }}>
            <Text style={styles.threadName}>{item.name}</Text>
            <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            {item.unread && <Icon name="message-alert" size={18} color={colors.error} style={{ marginLeft: 4 }} />}
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No chat threads.</Text>}
      contentContainerStyle={{ flexGrow: 1 }}
      accessibilityLabel="List of chat threads"
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
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  threadName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  lastMessage: {
    ...typography.caption,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
