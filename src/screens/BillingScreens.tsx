import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { fetchInvoices } from '../../shared/billingApi';
import { Invoice } from '../../shared/billingTypes';

export const BillingScreen = ({ navigation, route }: any) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const token = route?.params?.token;

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await fetchInvoices(token);
        setInvoices(data);
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Billing</Text>
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('InvoiceDetail', { token, invoiceId: item.id })}>
            <View style={styles.item}>
              <Text style={styles.itemTitle}>Invoice #{item.id}</Text>
              <Text>Amount: ${item.amount}</Text>
              <Text>Status: {item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export const InvoiceDetailScreen = ({ route }: any) => {
  const { token, invoiceId } = route.params;
  // You can fetch invoice details here using fetchInvoiceById
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoice Detail</Text>
      <Text>Invoice ID: {invoiceId}</Text>
      {/* Show more invoice details and payment options here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemTitle: { fontWeight: 'bold', fontSize: 18 },
});
