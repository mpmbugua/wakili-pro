import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatComponent } from '../components/chat/ChatComponent';
import { chatService } from '../services/chatService';

// Mock the chat service
vi.mock('../services/chatService', () => ({
  chatService: {
    getChatRooms: vi.fn(),
    getChatMessages: vi.fn(),
    sendMessage: vi.fn(),
    createChatRoom: vi.fn(),
    initializeSocket: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    disconnect: vi.fn(),
    onNewMessage: vi.fn(),
    onUserTyping: vi.fn(),
    sendTypingStatus: vi.fn(),
    sendSocketMessage: vi.fn()
  }
}));

const mockChatRooms = [
  {
    id: 'room_1',
    bookingId: 'booking_123',
    clientId: 'client_123',
    lawyerId: 'lawyer_456',
    status: 'ACTIVE' as const,
    lastActivity: new Date(),
    service: {
      id: 'service_1',
      title: 'Legal Consultation',
      type: 'CONSULTATION'
    },
    client: {
      id: 'client_123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    },
    lawyer: {
      id: 'lawyer_456',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    },
    unreadCount: 2,
    lastMessage: {
      content: 'Hello, how can I help you?',
      createdAt: new Date(),
      senderId: 'lawyer_456'
    }
  }
];

const mockMessages = [
  {
    id: 'msg_1',
    roomId: 'room_1',
    senderId: 'client_123',
    content: 'I need help with my case',
    messageType: 'TEXT' as const,
    isRead: true,
    createdAt: new Date(),
    sender: {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  {
    id: 'msg_2',
    roomId: 'room_1',
    senderId: 'lawyer_456',
    content: 'I\'d be happy to help. Can you provide more details?',
    messageType: 'TEXT' as const,
    isRead: false,
    createdAt: new Date(),
    sender: {
      firstName: 'Jane',
      lastName: 'Smith'
    }
  }
];

describe('ChatComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatService.getChatRooms).mockResolvedValue({ success: true, data: mockChatRooms });
    vi.mocked(chatService.getChatMessages).mockResolvedValue({ success: true, data: mockMessages, pagination: { page: 1, limit: 50, total: 2, pages: 1 } });
    vi.mocked(chatService.sendMessage).mockResolvedValue({ success: true, data: mockMessages[0] });
    // Mock socket connection
    vi.mocked(chatService.initializeSocket).mockReturnValue({
      on: (event: string, cb: Function) => {
        if (event === 'connect') {
          setTimeout(cb, 10); // async trigger
        }
      },
      emit: vi.fn(),
      connected: true
    } as any);
  });

  it('renders chat messages and sends a message', async () => {
    render(
      <ChatComponent roomId={mockChatRooms[0].id} room={mockChatRooms[0]} onClose={vi.fn()} />
    );

    // Wait for connection
    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(await screen.findByText('I need help with my case')).toBeInTheDocument();
    expect(screen.getByText("I'd be happy to help. Can you provide more details?")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
      target: { value: 'Thank you for your help!' }
    });
    fireEvent.click(screen.getByText('Send'));

    expect(chatService.sendMessage).toHaveBeenCalledWith({
      roomId: mockChatRooms[0].id,
      content: 'Thank you for your help!',
      messageType: 'TEXT'
    });
  });
});
