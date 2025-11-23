import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { aiService } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'document';
    name: string;
    url: string;
    size?: number;
  }>;
  sources?: Array<{
    type: string;
    title: string;
    jurisdiction: string;
    url?: string;
    citation?: string;
    section?: string;
    score?: number;
  }>;
  consultationSuggestion?: {
    message: string;
    benefits: string[];
    callToAction: {
      text: string;
      link: string;
      price: string;
    };
  };
  recommendations?: Array<{
    type: 'lawyer' | 'document';
    title: string;
    description: string;
    price?: string;
    cta: string;
  }>;
}

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // AI Response handlers - using backend API
  const handleSendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || '📎 Sent attachments',
      timestamp: new Date(),
      attachments: attachedFiles.map((file, idx) => ({
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        url: previewUrls[idx] || '',
        size: file.size
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentFiles = [...attachedFiles];
    setInput('');
    setIsLoading(true);

    try {
      // Send to backend using FormData for file uploads
      const formData = new FormData();
      formData.append('question', currentInput);
      
      // Add attachments (backend expects 'attachments' field)
      currentFiles.forEach(file => {
        formData.append('attachments', file);
      });

      // Use full backend URL in production
      const apiUrl = import.meta.env.VITE_API_URL || 'https://wakili-pro.onrender.com/api';
      const response = await fetch(`${apiUrl}/ai/ask`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${response.status}: Expected JSON but got ${contentType}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Server returned empty response');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error. Response text:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || response.statusText}`);
      }

      if (data.success && data.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          timestamp: new Date(),
          sources: data.data.sources,
          consultationSuggestion: data.data.consultationSuggestion
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an error processing your request. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setAttachedFiles([]);
      setPreviewUrls([]);
    }
  };

  const handleRecommendationClick = (recType: 'lawyer' | 'document', title: string) => {
    if (!isAuthenticated) {
      // Store intended action and redirect to login
      sessionStorage.setItem('pendingAction', JSON.stringify({ type: recType, title }));
      navigate('/login', { state: { from: '/ai', message: 'Please log in to continue' } });
    } else {
      // Handle authenticated user actions
      if (recType === 'lawyer') {
        navigate('/lawyers'); // Will create this page next
      } else {
        navigate('/marketplace'); // Will create this page next
      }
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await sendVoiceQuery(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceQuery = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      const audioBase64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix
          const base64Data = base64.split(',')[1] || base64;
          resolve(base64Data);
        };
        reader.readAsDataURL(audioBlob);
      });

      const audioBase64 = await audioBase64Promise;
      const response = await aiService.processVoiceQuery(audioBase64);
      
      if (response.success && response.data) {
        // Add user message (transcribed text)
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `🎤 ${response.data.query}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
          sources: response.data.sources,
          consultationSuggestion: response.data.consultationSuggestion
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.message || 'Voice processing failed');
      }
    } catch (error) {
      console.error('Voice query error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚠️ Failed to process voice query. Please try typing instead.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Unsupported file type. Please upload images or documents (PDF, DOC, DOCX).`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name}: File too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setAttachedFiles(prev => [...prev, ...validFiles]);

    // Create preview URLs for images
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrls(prev => [...prev, '']);
      }
    });
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setAttachedFiles(prev => [...prev, file]);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrls(prev => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="navbar">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-slate-600 hover:text-primary font-medium transition-colors"
              >
                ← Back to Home
              </button>
              <div className="border-l border-slate-300 h-6"></div>
              <h1 className="text-2xl font-display font-bold text-slate-900">AI Legal Assistant</h1>
            </div>
            {!isAuthenticated && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600">Have an account?</span>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-outline text-sm"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
      />

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-large overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-4 shadow-soft ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-slate-50 text-slate-900 border border-slate-200'
                  }`}
                >
                  <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="max-w-xs rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm text-gray-700">{attachment.name}</span>
                              {attachment.size && (
                                <span className="text-xs text-gray-500">
                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Legal Sources Cited (RAG) */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                        📚 Legal Sources Cited:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white rounded-md p-3 border border-gray-200 text-gray-800"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-900">
                                  {idx + 1}. {source.title}
                                </p>
                                {source.citation && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Citation: {source.citation}
                                  </p>
                                )}
                                {source.section && (
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    {source.section}
                                  </p>
                                )}
                              </div>
                              {source.score !== undefined && (
                                <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  {(source.score * 100).toFixed(0)}% relevant
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {message.recommendations && (
                    <div className="mt-4 space-y-3">
                      {message.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-4 border border-gray-200 text-gray-900"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                  rec.type === 'lawyer' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {rec.type === 'lawyer' ? '👨‍⚖️ Lawyer' : '📄 Document'}
                                </span>
                                {rec.price && (
                                  <span className="text-sm font-bold text-blue-600">{rec.price}</span>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm">{rec.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                            </div>
                            <button
                              onClick={() => handleRecommendationClick(rec.type, rec.title)}
                              className="ml-4 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                            >
                              {rec.cta}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Attachment Preview */}
          {attachedFiles.length > 0 && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Attachments ({attachedFiles.length})
                </p>
                <button
                  onClick={() => {
                    setAttachedFiles([]);
                    setPreviewUrls([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={previewUrls[idx]}
                          alt={file.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-300 flex flex-col items-center justify-center p-2">
                          <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs text-gray-600 text-center truncate w-full">
                            {file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-end space-x-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me any legal question..."
                className="input-field flex-1 resize-none"
                rows={3}
                disabled={isRecording}
              />
              
              {/* File Upload Button */}
              <button
                onClick={openFileSelector}
                disabled={isLoading || isRecording}
                className="btn-ghost p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload image or document"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              {/* Camera Button */}
              <button
                onClick={openCamera}
                disabled={isLoading || isRecording}
                className="btn-ghost p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Take photo"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              
              {/* Microphone Button */}
              <button
                onClick={toggleRecording}
                disabled={isLoading}
                className={`p-3 rounded-xl font-medium transition-all duration-200 ${
                  isRecording
                    ? 'bg-error text-white hover:bg-red-700 animate-pulse shadow-medium'
                    : 'btn-ghost'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? 'Stop recording' : 'Start voice recording'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isRecording ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  )}
                </svg>
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || isRecording}
                className="btn-primary px-6 py-3 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              💡 {isRecording 
                ? '🎤 Recording... Click the microphone again to stop and send' 
                : attachedFiles.length > 0
                  ? `📎 ${attachedFiles.length} file(s) attached. Type a message or click Send.`
                  : 'Type your question, upload documents/images, use camera, or click the microphone to speak.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
