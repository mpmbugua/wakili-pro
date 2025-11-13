import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

const events = [
  { id: '1', title: 'Consultation', date: '2025-11-12', type: 'meeting' },
  { id: '2', title: 'Court Date', date: '2025-11-15', type: 'court' },
];

export const Calendar = ({ onAddEvent, onSelect }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Calendar</Text>
    <FlatList
      data={events}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.eventCard} onPress={() => onSelect(item)} accessibilityRole="button" accessibilityLabel={`View ${item.title}`}>
          <Icon name={item.type === 'court' ? 'gavel' : 'calendar-account'} size={24} color={colors.primary} />
          <View style={{ marginLeft: spacing.md }}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDate}>{item.date}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No events scheduled.</Text>}
      contentContainerStyle={{ flexGrow: 1 }}
      accessibilityLabel="List of calendar events"
    />
    <TouchableOpacity style={styles.addBtn} onPress={onAddEvent} accessibilityRole="button" accessibilityLabel="Add Event">
      <Icon name="plus-circle" size={28} color={colors.secondary} />
      <Text style={styles.addText}>Add Event</Text>
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
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  eventDate: {
    ...typography.caption,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.lg,
    elevation: 1,
  },
  addText: {
    ...typography.body,
    color: colors.secondary,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
});
