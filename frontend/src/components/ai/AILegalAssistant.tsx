import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, User, Brain, BookOpen, FileText, Users } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { cn } from '../../lib/utils';

interface AIMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  confidence?: number;
  sources?: Array<{
    type: string;
    title: string;
    jurisdiction: string;
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
  audioUrl?: string;
  isVoiceMessage?: boolean;
}

interface QueryLimits {
  daily: { used: number; limit: number; remaining: number };
  monthly: { used: number; limit: number; remaining: number };
  isAuthenticated: boolean;
}

const AILegalAssistant: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [queryLimits, setQueryLimits] = useState<QueryLimits | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = false; // TODO: Get from auth store when available

  useEffect(() => {
    // Load initial greeting and query limits
    loadInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    try {
      // Load query limits
      const limitsResponse = await aiService.getQueryLimits();
      if (limitsResponse.success && limitsResponse.data) {
        setQueryLimits(limitsResponse.data);
      }

      // Add welcome message
      const welcomeMessage: AIMessage = {
        id: 'welcome',
        content: `Welcome to Wakili Pro AI Legal Assistant! 🏛️

I'm here to provide free legal information based on Kenyan law. I can help you understand:

• **Legal concepts and procedures**
• **Your rights and obligations**
• **Basic legal processes**
• **General guidance on legal matters**

${!isAuthenticated ? `As a guest, you get **5 free questions daily**. Sign up for 50 monthly queries and access to premium features!` : ''}

**Important:** This is general legal information only. For specific legal advice about your situation, I recommend consulting with one of our qualified lawyers.

How can I help you today? You can type your question or use the microphone 🎤 to ask verbally.`,
        type: 'ai',
        timestamp: new Date(),
        confidence: 1.0
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.askQuestion({
        query: inputMessage,
        type: 'LEGAL_ADVICE',
        urgency: 'MEDIUM',
        includeReferences: true
      });

      if (response.success && response.data) {
        const aiMessage: AIMessage = {
          id: response.data.id,
          content: response.data.answer,
          type: 'ai',
          timestamp: new Date(),
          confidence: response.data.confidence,
          sources: response.data.sources,
          consultationSuggestion: response.data.consultationSuggestion
        };

        setMessages(prev => [...prev, aiMessage]);

        // Update query limits
        if (response.data?.remainingQueries !== undefined) {
          setQueryLimits(prev => prev ? {
            ...prev,
            daily: { ...prev.daily, remaining: response.data?.remainingQueries || 0 }
          } : null);
        }
      } else {
        throw new Error(response.message || 'Failed to get AI response');
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        content: `I apologize, but I encountered an error processing your question. ${error instanceof Error ? error.message : 'Please try again or contact support.'}`,
        type: 'ai',
        timestamp: new Date(),
        confidence: 0.1
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processVoiceQuery(audioBlob);
      };
    }
  };

  const processVoiceQuery = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await aiService.processVoiceQuery(base64Audio);
        
        if (response.success && response.data) {
          const userMessage: AIMessage = {
            id: `voice-user-${Date.now()}`,
            content: '🎤 ' + response.data.query || 'Voice message',
            type: 'user',
            timestamp: new Date(),
            isVoiceMessage: true
          };

          const aiMessage: AIMessage = {
            id: response.data.id,
            content: response.data.answer,
            type: 'ai',
            timestamp: new Date(),
            confidence: response.data.confidence,
            sources: response.data.sources,
            consultationSuggestion: response.data.consultationSuggestion
          };

          setMessages(prev => [...prev, userMessage, aiMessage]);
        } else {
          throw new Error(response.message || 'Voice processing failed');
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage: AIMessage = {
        id: `voice-error-${Date.now()}`,
        content: 'Sorry, I had trouble processing your voice message. Please try typing your question instead.',
        type: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioResponse = async (messageId: string) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      if (playingAudio === messageId) {
        setPlayingAudio(null);
        return;
      }

      setPlayingAudio(messageId);
      const audioResponse = await aiService.getVoiceResponse(messageId);
      
      if (audioResponse) {
        const audio = new Audio();
        const audioUrl = URL.createObjectURL(audioResponse);
        audio.src = audioUrl;
        
        setCurrentAudio(audio);
        
        audio.onended = () => {
          setPlayingAudio(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setPlayingAudio(null);
          console.error('Audio playback error');
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setPlayingAudio(null);
    }
  };

  const handleConsultationClick = (link: string) => {
    // Navigate to marketplace or booking page
    window.location.href = link;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Legal Assistant</h1>
              <p className="text-indigo-100 text-sm">Free legal information powered by Kenyan law</p>
            </div>
          </div>
          
          {/* Query Limits Display */}
          {queryLimits && (
            <div className="text-right">
              <div className="text-sm text-indigo-100">
                {queryLimits.isAuthenticated ? 'Monthly' : 'Daily'} queries
              </div>
              <div className="text-lg font-bold">
                {queryLimits.isAuthenticated ? 
                  `${queryLimits.monthly.remaining}/${queryLimits.monthly.limit}` :
                  `${queryLimits.daily.remaining}/${queryLimits.daily.limit}`
                } left
              </div>
              {!queryLimits.isAuthenticated && (
                <button 
                  onClick={() => window.location.href = '/auth/register'}
                  className="text-xs bg-white/20 px-2 py-1 rounded mt-1 hover:bg-white/30 transition-colors"
                >
                  Sign up for more
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={cn(
            "flex items-start space-x-3",
            message.type === 'user' ? 'justify-end' : 'justify-start'
          )}>
            {message.type === 'ai' && (
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
            )}
            
            <div className={cn(
              "max-w-2xl rounded-lg p-4 shadow",
              message.type === 'user' 
                ? 'bg-indigo-600 text-white ml-auto' 
                : 'bg-white border'
            )}>
              {/* Message Content */}
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* AI Message Features */}
              {message.type === 'ai' && (
                <div className="mt-3 space-y-3">
                  {/* Confidence and Audio */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {message.confidence && (
                      <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                    )}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => playAudioResponse(message.id)}
                        className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
                        disabled={playingAudio === message.id}
                      >
                        {playingAudio === message.id ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                        <span>{playingAudio === message.id ? 'Playing...' : 'Listen'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Legal References
                      </h4>
                      <div className="space-y-1">
                        {message.sources.map((source, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">{source.type}</span>: {source.title}
                            {source.jurisdiction && ` (${source.jurisdiction})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consultation Suggestion */}
                  {message.consultationSuggestion && (
                    <div className="border-t pt-3">
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 p-1 bg-amber-100 rounded">
                            <Users className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-amber-800 mb-2">
                              {message.consultationSuggestion.message}
                            </p>
                            
                            <div className="text-xs text-amber-700 mb-3">
                              <strong>Benefits of professional consultation:</strong>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {message.consultationSuggestion.benefits.map((benefit, index) => (
                                  <li key={index}>{benefit}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <button
                              onClick={() => handleConsultationClick(message.consultationSuggestion!.callToAction.link)}
                              className="bg-amber-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2"
                            >
                              <FileText className="h-4 w-4" />
                              <span>{message.consultationSuggestion.callToAction.text}</span>
                              <span className="text-amber-200">({message.consultationSuggestion.callToAction.price})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Timestamp */}
              <div className={cn(
                "text-xs mt-2",
                message.type === 'user' ? 'text-indigo-200' : 'text-gray-400'
              )}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask any legal question about Kenyan law..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          {/* Voice Input Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "p-3 rounded-lg border-2 transition-all duration-200",
              isRecording 
                ? "bg-red-500 border-red-500 text-white animate-pulse" 
                : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
            )}
            disabled={isLoading}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        {/* Query Limit Warning */}
        {queryLimits && !queryLimits.isAuthenticated && queryLimits.daily.remaining <= 1 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-amber-800">
                ⚠️ You have {queryLimits.daily.remaining} question{queryLimits.daily.remaining !== 1 ? 's' : ''} remaining today.
              </div>
              <button
                onClick={() => window.location.href = '/auth/register'}
                className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition-colors"
              >
                Sign up for 50/month
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AILegalAssistant;