import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, FlatList, Alert } from 'react-native';
import { fetchInvoiceById, fetchPayments, makePayment } from '../../shared/billingApi';
import { Invoice, Payment } from '../../shared/billingTypes';

export default function InvoiceDetailScreen({ route }: any) {
  const { token, invoiceId } = route.params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const inv = await fetchInvoiceById(token, invoiceId);
        setInvoice(inv);
        const pays = await fetchPayments(token, invoiceId);
        setPayments(pays);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, invoiceId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      await makePayment(token, invoiceId, invoice?.amount || 0, 'card');
      Alert.alert('Payment successful');
    } catch {
      Alert.alert('Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!invoice) return <Text>No invoice data found.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoice #{invoice.id}</Text>
      <Text>Status: {invoice.status}</Text>
      <Text>Amount: {invoice.amount}</Text>
      <Text>Issued: {invoice.issuedAt}</Text>
      <Text>Due: {invoice.dueAt}</Text>
      <Button title={paying ? 'Paying...' : 'Pay Now'} onPress={handlePay} disabled={paying || invoice.status === 'paid'} />
      <Text style={styles.subtitle}>Payments</Text>
      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.paymentItem}>
            <Text>Amount: {item.amount}</Text>
            <Text>Paid At: {item.paidAt}</Text>
            <Text>Method: {item.method}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  paymentItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
