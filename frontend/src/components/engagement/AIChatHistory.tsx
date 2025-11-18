import React from 'react';

interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
interface AIChatSession {
  messages: AIChatMessage[];
}
export const AIChatHistory: React.FC<{ chats: AIChatSession[] }> = ({ chats }) => (
  <div className="mt-6">
    <h3 className="font-bold text-lg mb-2">AI Chat History</h3>
    <ul className="space-y-2">
      {chats.map((chat, i) => (
        <li key={i} className="bg-gray-50 p-2 rounded">
          {chat.messages.map((msg, j) => (
            <div key={j} className={msg.role === 'user' ? 'text-right text-blue-700' : 'text-left text-gray-700'}>
              <span className="block">{msg.content}</span>
            </div>
          ))}
        </li>
      ))}
    </ul>
  </div>
);
