
import type { UserRole } from './user';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}


export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// AI Legal Assistant Types
export interface AIQueryRequest {
  query: string;
  type: 'LEGAL_ADVICE' | 'DOCUMENT_REVIEW' | 'CASE_ANALYSIS' | 'GENERAL_QUESTION';
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  includeReferences?: boolean;
  context?: Record<string, any>;
}

export interface AIQueryResponse {
  id: string;
  query: string;
  answer: string;
  confidence: number;
  sources?: Array<{
    type: string;
    title: string;
    jurisdiction: string;
    url?: string;
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
  remainingQueries?: number;
  createdAt: Date;
}

export interface VoiceQueryRequest {
  audioData: string; // base64 encoded audio
  format: 'mp3' | 'wav' | 'webm' | 'ogg' | 'm4a';
  language?: string;
}