import axiosInstance from './axiosConfig';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  specialty: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  }>;
}

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await axiosInstance.get('/messages/conversations');
  return response.data.data;
};

/**
 * Get or create a conversation with another user
 */
export const getOrCreateConversation = async (otherUserId: string): Promise<ConversationDetail> => {
  const response = await axiosInstance.post('/messages/conversations', {
    otherUserId
  });
  return response.data.data;
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (before) {
    params.append('before', before);
  }

  const response = await axiosInstance.get(`/messages/${conversationId}?${params.toString()}`);
  return response.data.data;
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  attachments?: File[]
): Promise<Message> => {
  const formData = new FormData();
  formData.append('content', content);

  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }

  const response = await axiosInstance.post(`/messages/${conversationId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

/**
 * Mark messages as read in a conversation
 */
export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  await axiosInstance.put(`/messages/${conversationId}/read`);
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  await axiosInstance.delete(`/messages/${messageId}`);
};
