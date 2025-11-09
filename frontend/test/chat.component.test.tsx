import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatRoomsList } from '../src/components/chat/ChatRoomsList';
import { ChatComponent } from '../src/components/chat/ChatComponent';
import { chatService } from '../src/services/chatService';

// Mock the chat service
vi.mock('../src/services/chatService', () => ({
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

describe('Chat System Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChatRoomsList Component', () => {
    it('should render loading state initially', () => {
      vi.mocked(chatService.getChatRooms).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<ChatRoomsList />);
      
      expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeDefined();
    });

    it('should display chat rooms after loading', async () => {
      vi.mocked(chatService.getChatRooms).mockResolvedValue({
        success: true,
        data: mockChatRooms,
        message: 'Chat rooms loaded'
      });

      render(<ChatRoomsList />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeDefined();
        expect(screen.getByText('Legal Consultation')).toBeDefined();
        expect(screen.getByText('Hello, how can I help you?')).toBeDefined();
      });
    });

    it('should display empty state when no chat rooms exist', async () => {
      vi.mocked(chatService.getChatRooms).mockResolvedValue({
        success: true,
        data: [],
        message: 'No chat rooms found'
      });

      render(<ChatRoomsList />);

      await waitFor(() => {
        expect(screen.getByText(/no chat rooms yet/i)).toBeDefined();
      });
    });

    it('should handle error state', async () => {
      vi.mocked(chatService.getChatRooms).mockRejectedValue(
        new Error('Failed to fetch')
      );

      render(<ChatRoomsList />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load chat rooms/i)).toBeDefined();
      });
    });

    it('should allow creating a demo chat room', async () => {
      vi.mocked(chatService.getChatRooms).mockResolvedValue({
        success: true,
        data: [],
        message: 'No chat rooms found'
      });

      vi.mocked(chatService.createChatRoom).mockResolvedValue({
        success: true,
        data: mockChatRooms[0],
        message: 'Chat room created'
      });

      render(<ChatRoomsList />);

      await waitFor(() => {
        const createButton = screen.getByText(/create demo chat room/i);
        fireEvent.click(createButton);
      });

      expect(chatService.createChatRoom).toHaveBeenCalledWith('demo_booking_123');
    });

    it('should open chat component when room is selected', async () => {
      vi.mocked(chatService.getChatRooms).mockResolvedValue({
        success: true,
        data: mockChatRooms,
        message: 'Chat rooms loaded'
      });

      render(<ChatRoomsList />);

      await waitFor(() => {
        const roomElement = screen.getByText('Jane Smith').closest('[role="button"]') || 
                           screen.getByText('Jane Smith').closest('div');
        if (roomElement) {
          fireEvent.click(roomElement);
        }
      });

      // Should transition to chat component view
      await waitFor(() => {
        expect(screen.queryByText('Chat Rooms')).toBeNull();
      });
    });
  });

  describe('ChatComponent', () => {
    const mockRoom = mockChatRooms[0];
    const mockOnClose = vi.fn();

    beforeEach(() => {
      vi.mocked(chatService.initializeSocket).mockReturnValue({
        on: vi.fn(),
        emit: vi.fn(),
        connected: true
      } as any);

      vi.mocked(chatService.getChatMessages).mockResolvedValue({
        success: true,
        data: {
          messages: mockMessages,
          pagination: { page: 1, limit: 50, total: 2, hasMore: false }
        },
        message: 'Messages loaded'
      });
    });

    it('should render chat interface', async () => {
      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Jane Smith')).toBeDefined();
      expect(screen.getByText('Legal Consultation')).toBeDefined();
      expect(screen.getByPlaceholderText(/type your message/i)).toBeDefined();
    });

    it('should load and display messages', async () => {
      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('I need help with my case')).toBeDefined();
        expect(screen.getByText('I\'d be happy to help. Can you provide more details?')).toBeDefined();
      });

      expect(chatService.getChatMessages).toHaveBeenCalledWith(mockRoom.id);
    });

    it('should send messages when form is submitted', async () => {
      vi.mocked(chatService.sendMessage).mockResolvedValue({
        success: true,
        data: {
          ...mockMessages[0],
          content: 'New test message'
        },
        message: 'Message sent'
      });

      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByText(/send/i);

      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(chatService.sendSocketMessage).toHaveBeenCalledWith({
        roomId: mockRoom.id,
        content: 'Test message',
        messageType: 'TEXT'
      });

      expect(chatService.sendMessage).toHaveBeenCalledWith({
        roomId: mockRoom.id,
        content: 'Test message',
        messageType: 'TEXT'
      });
    });

    it('should handle Enter key to send message', async () => {
      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      const messageInput = screen.getByPlaceholderText(/type your message/i);

      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.keyPress(messageInput, { key: 'Enter', code: 'Enter' });

      expect(chatService.sendSocketMessage).toHaveBeenCalled();
    });

    it('should prevent sending empty messages', async () => {
      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      const sendButton = screen.getByText(/send/i);
      
      // Button should be disabled when no message
      expect(sendButton.getAttribute('disabled')).toBeDefined();

      fireEvent.click(sendButton);
      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should show connection status', async () => {
      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      // Should show connected status initially
      expect(screen.getByText(/connected/i)).toBeDefined();
    });

    it('should call onClose when close button is clicked', async () => {
      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should initialize socket connection with proper setup', async () => {
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => 'mock_token'),
          setItem: vi.fn(),
          removeItem: vi.fn()
        },
        writable: true
      });

      render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      expect(chatService.initializeSocket).toHaveBeenCalledWith('mock_token');
      expect(chatService.joinRoom).toHaveBeenCalledWith(mockRoom.id);
    });

    it('should clean up on unmount', () => {
      const { unmount } = render(
        <ChatComponent 
          roomId={mockRoom.id}
          room={mockRoom}
          onClose={mockOnClose}
        />
      );

      unmount();

      expect(chatService.leaveRoom).toHaveBeenCalledWith(mockRoom.id);
      expect(chatService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Chat Service Integration', () => {
    it('should handle real-time message updates', async () => {
      const testRoom = mockChatRooms[0];
      const mockSocket = {
        on: vi.fn(),
        emit: vi.fn(),
        connected: true
      };

      vi.mocked(chatService.initializeSocket).mockReturnValue(mockSocket as any);

      render(
        <ChatComponent 
          roomId={testRoom.id}
          room={testRoom}
          onClose={vi.fn()}
        />
      );

      expect(chatService.onNewMessage).toHaveBeenCalled();
      expect(chatService.onUserTyping).toHaveBeenCalled();
    });

    it('should send typing indicators', async () => {
      const testRoom = mockChatRooms[0];
      
      render(
        <ChatComponent 
          roomId={testRoom.id}
          room={testRoom}
          onClose={vi.fn()}
        />
      );

      const messageInput = screen.getByPlaceholderText(/type your message/i);
      
      fireEvent.change(messageInput, { target: { value: 'Typing...' } });

      await waitFor(() => {
        expect(chatService.sendTypingStatus).toHaveBeenCalledWith(
          testRoom.id, 
          true
        );
      });
    });
  });
});