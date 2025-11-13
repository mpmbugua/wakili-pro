import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchChatThreads } from '../../shared/chatApi';
import { ChatThread } from '../../shared/chatTypes';

export default function ChatListScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchChatThreads(token);
        setThreads(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load chats');
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
      <Text style={styles.title}>Chats</Text>
      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('ChatDetail', { token, chatId: item.id })}>
            <View style={styles.threadItem}>
              <Text style={styles.threadTitle}>Chat with: {item.participants.join(', ')}</Text>
              <Text>Last: {item.lastMessage?.content || 'No messages yet'}</Text>
              <Text style={styles.date}>{item.updatedAt}</Text>
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
  threadItem: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  threadTitle: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  error: { color: 'red', textAlign: 'center', marginTop: 32 },
});
