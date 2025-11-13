import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchNotifications, markNotificationRead } from '../../shared/notificationApi';
import { AppNotification } from '../../shared/notificationTypes';

export default function NotificationsScreen({ route }: any) {
  const { token } = route.params;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotifications(token);
        setNotifications(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(token, id);
      setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleMarkRead(item.id)}>
            <View style={[styles.notification, item.read && styles.read]}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text>{item.message}</Text>
              <Text style={styles.date}>{item.createdAt}</Text>
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
  notification: { padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  read: { backgroundColor: '#f0f0f0' },
  notificationTitle: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
