import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchInvoices } from '../../shared/billingApi';
import { Invoice } from '../../shared/billingTypes';

export default function InvoiceListScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInvoices(token);
        setInvoices(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoices</Text>
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('InvoiceDetail', { token, invoiceId: item.id })}>
            <View style={styles.invoiceItem}>
              <Text style={styles.invoiceTitle}>Invoice #{item.id}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Amount: {item.amount}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  invoiceItem: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
