import axios from 'axios';
import { ChatThread, ChatMessage } from './chatTypes';
import { API_URL } from '../src/config';

export async function fetchChatThreads(token: string): Promise<ChatThread[]> {
  const res = await axios.get(`${API_URL}/chats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchMessages(token: string, chatId: string): Promise<ChatMessage[]> {
  const res = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function sendMessage(token: string, chatId: string, content: string): Promise<ChatMessage> {
  const res = await axios.post(`${API_URL}/chats/${chatId}/messages`, { content }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
