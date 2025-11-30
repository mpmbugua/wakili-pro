# Real-Time Messaging System Implementation

## Overview
Complete implementation of a real-time messaging system with WebSocket support, file attachments, and comprehensive features for client-lawyer communication.

## Features Implemented

### ✅ Backend API
- **Message Controller** (`backend/src/controllers/messageController.ts`)
  - Get all conversations for a user
  - Create or get existing conversation
  - Fetch messages with pagination
  - Send messages with file attachments
  - Mark messages as read
  - Delete messages

### ✅ Real-Time Communication
- **Socket.IO Integration** (`backend/src/services/socketService.ts`)
  - WebSocket authentication using JWT
  - Real-time message delivery
  - Typing indicators
  - Read receipts
  - Online/offline status tracking
  - User presence management
  - Automatic room management

### ✅ File Attachments
- **Multi-file Upload Support**
  - Images (JPEG, PNG, GIF)
  - PDFs
  - Microsoft Office documents (Word, Excel)
  - Maximum 5 files per message
  - 10MB file size limit per file
  - Cloudinary storage integration
  - File metadata tracking (name, size, type)

### ✅ Database Schema
- **New Models** (added to `prisma/schema.prisma`)
  - `Conversation` - Chat conversations
  - `ConversationParticipant` - User participation in conversations
  - `Message` - Individual messages
  - `MessageAttachment` - File attachments
  - User fields: `onlineStatus`, `lastSeen`

### ✅ Frontend Services
- **Socket Service** (`frontend/src/services/socketService.ts`)
  - WebSocket connection management
  - Auto-reconnection logic
  - Event emission and listening
  - Typing indicators
  - Read receipts
  - Status updates

- **Message API Service** (`frontend/src/services/messageService.ts`)
  - REST API integration
  - Type-safe interfaces
  - Conversation management
  - Message CRUD operations
  - File upload handling

## API Endpoints

### GET /api/messages/conversations
Get all conversations for authenticated user
```typescript
Response: {
  success: true,
  data: Conversation[]
}
```

### POST /api/messages/conversations
Create or get conversation with another user
```typescript
Body: { otherUserId: string }
Response: {
  success: true,
  data: ConversationDetail
}
```

### GET /api/messages/:conversationId
Get messages in a conversation
```typescript
Query: { limit?: number, before?: ISO date }
Response: {
  success: true,
  data: Message[]
}
```

### POST /api/messages/:conversationId
Send a message
```typescript
Body: FormData {
  content: string
  attachments?: File[] (max 5 files)
}
Response: {
  success: true,
  data: Message
}
```

### PUT /api/messages/:conversationId/read
Mark all messages as read
```typescript
Response: {
  success: true,
  message: "Messages marked as read"
}
```

### DELETE /api/messages/:messageId
Delete a message (sender only)
```typescript
Response: {
  success: true,
  message: "Message deleted successfully"
}
```

## WebSocket Events

### Client → Server

#### `typing_start`
```typescript
{ conversationId: string }
```

#### `typing_stop`
```typescript
{ conversationId: string }
```

#### `message_read`
```typescript
{ messageId: string, conversationId: string }
```

#### `set_online_status`
```typescript
status: 'online' | 'away' | 'offline'
```

### Server → Client

#### `new_message`
```typescript
Message {
  id, conversationId, senderId, content, createdAt,
  sender: { id, firstName, lastName },
  attachments: []
}
```

#### `user_typing`
```typescript
{ userId: string, conversationId: string }
```

#### `user_stopped_typing`
```typescript
{ userId: string, conversationId: string }
```

#### `message_read_receipt`
```typescript
{ messageId: string, readBy: string }
```

#### `user_status_changed`
```typescript
{ userId: string, status: string, lastSeen: Date }
```

#### `conversation_updated`
```typescript
Conversation { ... }
```

## Usage Examples

### Frontend: Initialize WebSocket Connection
```typescript
import { socketService } from '../services/socketService';
import { useAuthStore } from '../store/authStore';

const { token } = useAuthStore();
socketService.connect(token);

// Listen for new messages
socketService.onNewMessage((message) => {
  console.log('New message:', message);
  // Update UI
});

// Send typing indicator
socketService.startTyping(conversationId);

// Stop typing
socketService.stopTyping(conversationId);
```

### Frontend: Send Message with Attachments
```typescript
import { sendMessage } from '../services/messageService';

const files: File[] = [file1, file2];
const message = await sendMessage(
  conversationId,
  "Hello, here are the documents",
  files
);
```

### Frontend: Fetch Conversations
```typescript
import { getConversations } from '../services/messageService';

const conversations = await getConversations();
setConversations(conversations);
```

### Backend: Emit New Message via Socket
```typescript
// In messageController.ts
const io = (req as any).io;
if (io) {
  conversation.participants
    .filter(p => p.userId !== userId)
    .forEach(participant => {
      io.to(`user:${participant.userId}`).emit('new_message', message);
    });
}
```

## Database Migration

Run the migration to create message tables:
```bash
cd backend
npx prisma migrate deploy
```

Migration creates:
- `Conversation` table
- `ConversationParticipant` table
- `Message` table
- `MessageAttachment` table
- User fields: `onlineStatus`, `lastSeen`

## Security Features

### Authentication
- JWT token validation for WebSocket connections
- User verification before connection
- Auto-disconnect on invalid token

### Authorization
- Users can only send messages in conversations they're part of
- Users can only delete their own messages
- Conversation participant verification on all actions

### Data Validation
- File type whitelist (images, PDFs, Office docs)
- File size limits (10MB per file, max 5 files)
- Input sanitization on message content

## Performance Optimizations

### Pagination
- Messages loaded in batches (default 50)
- "Load more" functionality with `before` parameter
- Chronological ordering

### WebSocket Efficiency
- Room-based messaging (no broadcast to all users)
- User-specific rooms (`user:{userId}`)
- Conversation-specific rooms
- Automatic cleanup on disconnect

### Database Indexing
- Indexed: `conversationId + createdAt`
- Indexed: `senderId`
- Indexed: `userId` (participants)
- Unique constraint: `conversationId + userId`

## UI Integration Status

### MessagesPage.tsx
Current state: Mock data implementation
Next steps:
1. Replace mock data with real API calls
2. Integrate WebSocket for real-time updates
3. Add file attachment UI
4. Implement typing indicators
5. Add read receipts

### Example Integration
```typescript
// Replace in MessagesPage.tsx
useEffect(() => {
  const fetchData = async () => {
    const data = await getConversations();
    setConversations(data);
  };
  fetchData();

  socketService.connect(token);
  socketService.onNewMessage((msg) => {
    // Update conversation list
  });

  return () => {
    socketService.disconnect();
  };
}, []);
```

## Testing Checklist

### Backend
- [x] Create conversation endpoint
- [x] Send message endpoint
- [x] Get messages endpoint
- [x] File upload functionality
- [x] WebSocket authentication
- [x] Real-time message delivery
- [ ] Integration tests

### Frontend
- [x] Socket service implementation
- [x] Message API service
- [ ] UI integration with real API
- [ ] File attachment UI
- [ ] Typing indicators UI
- [ ] Read receipts UI
- [ ] Online status indicators

### End-to-End
- [ ] Create conversation between client and lawyer
- [ ] Send text messages
- [ ] Send file attachments
- [ ] Real-time delivery
- [ ] Typing indicators
- [ ] Mark as read
- [ ] Delete message
- [ ] Reconnection handling

## Deployment Considerations

### Environment Variables
```env
# Frontend (.env)
VITE_API_URL=https://wakili-backend.onrender.com

# Backend (.env)
FRONTEND_URL=https://wakili-frontend.netlify.app
JWT_SECRET=your-secret-key
```

### CORS Configuration
Backend allows credentials and origin from `FRONTEND_URL`

### WebSocket Transport
- Primary: WebSocket
- Fallback: Long polling
- Works with Render, Railway, Heroku

## Next Steps

1. **Update MessagesPage.tsx**
   - Remove mock data
   - Integrate `getConversations()` API call
   - Connect WebSocket for real-time updates
   - Add file attachment UI (paperclip button)

2. **Add Typing Indicators**
   - Show "User is typing..." when receiving `user_typing` event
   - Hide after `user_stopped_typing` event

3. **Implement Read Receipts**
   - Mark messages as read when viewing conversation
   - Show "Read" checkmark on sent messages

4. **Add Online Status**
   - Display green dot for online users
   - Show "Last seen" for offline users

5. **File Attachment Preview**
   - Show image thumbnails
   - Display PDF icons
   - Download functionality

## Troubleshooting

### WebSocket Connection Fails
- Check JWT token is valid
- Verify CORS settings
- Ensure backend port is accessible
- Check firewall/proxy settings

### Messages Not Delivering in Real-Time
- Verify user is in correct conversation room
- Check socket connection status
- Review server logs for errors
- Ensure `req.io` is passed to controllers

### File Upload Fails
- Check file size (< 10MB)
- Verify file type is allowed
- Ensure Cloudinary credentials are set
- Check network connection

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│  React + Vite   │
│                 │
│  MessagesPage   │◄──┐
│  socketService  │   │
│  messageService │   │
└────────┬────────┘   │
         │            │
         │ HTTP       │ WebSocket
         │ REST API   │ Socket.IO
         │            │
┌────────▼────────────▼──┐
│   Backend              │
│  Node.js + Express     │
│                        │
│  /api/messages/*       │
│  socketService         │
│  messageController     │
└────────┬───────────────┘
         │
         │ Prisma ORM
         │
┌────────▼───────────────┐
│   PostgreSQL           │
│                        │
│  Conversation          │
│  ConversationParticipant│
│  Message               │
│  MessageAttachment     │
└────────────────────────┘
```

## Conclusion

The messaging system is fully implemented with:
- ✅ Complete REST API
- ✅ Real-time WebSocket communication
- ✅ File attachment support
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Online status tracking
- ✅ Database schema and migrations
- ✅ Frontend services

**Ready for UI integration and testing!**
