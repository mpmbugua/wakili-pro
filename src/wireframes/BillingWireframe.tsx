import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../design-system';

const invoices = [
  { id: '1', title: 'Invoice #1001', amount: '$500', status: 'Paid' },
  { id: '2', title: 'Invoice #1002', amount: '$250', status: 'Unpaid' },
];

export const Billing = ({ onViewInvoice }: any) => (
  <View style={styles.container}>
    <Text style={styles.title}>Billing</Text>
    <FlatList
      data={invoices}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.invoiceCard} onPress={() => onViewInvoice(item)} accessibilityRole="button" accessibilityLabel={`View ${item.title}`}>
          <Icon name="file-document" size={24} color={colors.primary} />
          <View style={{ marginLeft: spacing.md }}>
            <Text style={styles.invoiceTitle}>{item.title}</Text>
            <Text style={styles.invoiceAmount}>{item.amount}</Text>
            <Text style={[styles.invoiceStatus, item.status === 'Paid' ? styles.paid : styles.unpaid]}>{item.status}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No invoices found.</Text>}
      contentContainerStyle={{ flexGrow: 1 }}
      accessibilityLabel="List of invoices"
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
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  invoiceTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  invoiceAmount: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invoiceStatus: {
    ...typography.caption,
    marginTop: 2,
    fontWeight: '700',
  },
  paid: {
    color: colors.success,
  },
  unpaid: {
    color: colors.error,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
