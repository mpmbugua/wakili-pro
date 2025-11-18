import { ApiResponse, AIQueryRequest, AIQueryResponse } from '@shared/types';

interface QueryLimitsResponse {
  daily: { used: number; limit: number; remaining: number };
  monthly: { used: number; limit: number; remaining: number };
  isAuthenticated: boolean;
}

class AIService {
  private baseUrl = '/api/ai';

  // Get current query limits for the user
  async getQueryLimits(): Promise<ApiResponse<QueryLimitsResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/limits`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching query limits:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch query limits'
      };
    }
  }

  // Ask a legal question to the AI
  async askQuestion(request: AIQueryRequest): Promise<ApiResponse<AIQueryResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error asking AI question:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process question'
      };
    }
  }

  // Process voice query (speech to text + AI response)
  async processVoiceQuery(audioBase64: string, language: 'en' | 'sw' = 'en'): Promise<ApiResponse<AIQueryResponse & { query: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/voice-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          audioData: audioBase64,
          format: 'webm',
          language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing voice query:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process voice query'
      };
    }
  }

  // Get voice response for a message (text to speech)
  async getVoiceResponse(messageId: string, language: 'en' | 'sw' = 'en'): Promise<Blob | null> {
    try {
      const url = new URL(`${this.baseUrl}/voice-response/${messageId}`, window.location.origin);
      url.searchParams.append('language', language);
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error getting voice response:', error);
      return null;
    }
  }

  // Premium feature: Generate legal document
  async generateDocument(request: {
    type: string;
    parameters: Record<string, unknown>;
    clientInfo?: Record<string, unknown>;
  }): Promise<ApiResponse<{ documentId: string; content: string; downloadUrl: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating document:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate document'
      };
    }
  }

  // Premium feature: Analyze contract
  async analyzeContract(request: {
    content: string;
    contractType?: string;
    focusAreas?: string[];
  }): Promise<ApiResponse<{
    analysis: string;
    risks: Array<{ level: string; description: string; recommendation: string }>;
    clauses: Array<{ type: string; content: string; issues?: string[] }>;
    score: number;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing contract:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze contract'
      };
    }
  }

  // Get AI interaction history
  async getHistory(page = 1, limit = 20): Promise<ApiResponse<{
    queries: Array<{
      id: string;
      query: string;
      answer: string;
      type: string;
      createdAt: string;
      confidence?: number;
    }>;
    total: number;
    hasMore: boolean;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching AI history:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch history'
      };
    }
  }
}

export const aiService = new AIService();