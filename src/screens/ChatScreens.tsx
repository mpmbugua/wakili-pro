import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { fetchChatThreads, fetchMessages, sendMessage } from '../../shared/chatApi';
import { ChatThread, ChatMessage } from '../../shared/chatTypes';

export const ChatListScreen = ({ navigation, route }: any) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const token = route?.params?.token;

  useEffect(() => {
    async function loadThreads() {
      try {
        const data = await fetchChatThreads(token);
        setThreads(data);
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadThreads();
  }, [token]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('ChatDetail', { token, chatId: item.id })}>
            <View style={styles.item}>
              <Text style={styles.itemTitle}>Chat with {item.participants.join(', ')}</Text>
              <Text>Last: {item.lastMessage?.content || 'No messages'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export const ChatDetailScreen = ({ navigation, route }: any) => {
  const { token, chatId } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await fetchMessages(token, chatId);
        setMessages(data);
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [token, chatId]);

  async function handleSend() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await sendMessage(token, chatId, content);
      setContent('');
      // Reload messages
      const data = await fetchMessages(token, chatId);
      setMessages(data);
    } catch (e) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat Detail</Text>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.senderId}: {item.content}</Text>
            <Text>{item.sentAt}</Text>
          </View>
        )}
      />
      <TextInput style={styles.input} placeholder="Type a message" value={content} onChangeText={setContent} />
      <Button title="Send Message" onPress={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemTitle: { fontWeight: 'bold', fontSize: 18 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8, borderRadius: 4 },
});
