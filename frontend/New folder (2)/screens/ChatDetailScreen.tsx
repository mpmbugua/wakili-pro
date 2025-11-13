import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { fetchMessages, sendMessage } from '@wakili-pro/shared/chatApi';
import { ChatMessage } from '@wakili-pro/shared/chatTypes';

export default function ChatDetailScreen({ route }: any) {
  const { token, chatId } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMessages(token, chatId);
        setMessages(data);
      } catch (e) {
        // handle error or log
      }
      setLoading(false);
    };
    load();
  }, [token, chatId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      const msg = await sendMessage(token, chatId, input);
      setMessages(prev => [...prev, msg]);
      setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      // handle error or log
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.message, item.senderId === token ? styles.own : styles.other]}>
              <Text>{item.content}</Text>
              <Text style={styles.date}>{item.sentAt}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
          />
          <Button title="Send" onPress={handleSend} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  message: { padding: 10, borderRadius: 8, marginVertical: 4, maxWidth: '80%' },
  own: { backgroundColor: '#d1f7c4', alignSelf: 'flex-end' },
  other: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  date: { fontSize: 10, color: '#888', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginRight: 8 },
});
