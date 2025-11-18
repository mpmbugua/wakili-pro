export type AIQueryType = 'VOICE' | 'TEXT';
export type AIContext = 'LEGAL_ADVICE' | 'DOCUMENT_GENERATION' | 'LEGAL_RESEARCH' | 'CASE_ANALYSIS';
export type NewsCategory = 'LEGISLATION' | 'COURT_DECISIONS' | 'LEGAL_PRACTICE' | 'REGULATORY_UPDATES' | 'INDUSTRY_NEWS' | 'INTERNATIONAL_LAW';

export interface AIQuery {
  id: string;
  userId: string;
  query: string;
  type: AIQueryType;
  context: AIContext;
  response: string;
  confidence: number;
  tokensUsed: number;
  createdAt: Date;
}


export type DocumentType = 
  | 'CONTRACT'
  | 'WILL'
  | 'LEASE_AGREEMENT'
  | 'NDA'
  | 'EMPLOYMENT_CONTRACT'
  | 'POWER_OF_ATTORNEY';

export interface DocumentVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: string;
}

export interface LegalNewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  category: NewsCategory;
  tags: string[];
  publishedAt: Date;
  imageUrl?: string;
  externalUrl?: string;
  isBreaking: boolean;
  viewCount: number;
}

export interface NewsPreference {
  userId: string;
  categories: NewsCategory[];
  keywords: string[];
  notificationEnabled: boolean;
}