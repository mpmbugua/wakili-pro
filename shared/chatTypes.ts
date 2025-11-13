// Shared types for chat/messaging

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
  read: boolean;
}

export interface ChatThread {
  id: string;
  participants: string[];
  lastMessage: ChatMessage | null;
  updatedAt: string;
}
