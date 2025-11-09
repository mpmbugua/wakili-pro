export type CaseType = 
  | 'CIVIL'
  | 'CRIMINAL'
  | 'FAMILY'
  | 'CORPORATE'
  | 'PROPERTY'
  | 'EMPLOYMENT'
  | 'CONSTITUTIONAL';

export type CaseStatus = 'ACTIVE' | 'PENDING' | 'CLOSED' | 'ARCHIVED';
export type CLEActivityType = 'SEMINAR' | 'CONFERENCE' | 'ONLINE_COURSE' | 'WRITING' | 'TEACHING' | 'PRO_BONO';
export type CLEStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Case {
  id: string;
  lawyerId: string;
  clientId?: string;
  title: string;
  caseNumber?: string;
  court?: string;
  caseType: CaseType;
  status: CaseStatus;
  dateOpened: Date;
  dateClosed?: Date;
  description: string;
  documents: CaseDocument[];
  events: CaseEvent[];
  billingEntries: BillingEntry[];
}

export interface CaseDocument {
  id: string;
  caseId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  eventDate: Date;
  eventType: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingEntry {
  id: string;
  caseId: string;
  description: string;
  timeSpent: number; // minutes
  hourlyRate: number;
  totalAmount: number;
  date: Date;
  isBillable: boolean;
}

export interface CLERecord {
  id: string;
  lawyerId: string;
  activityType: CLEActivityType;
  title: string;
  provider: string;
  hoursEarned: number;
  dateCompleted: Date;
  certificateUrl?: string;
  status: CLEStatus;
}

export interface LawyerAnalytics {
  id: string;
  lawyerId: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  periodStart: Date;
  periodEnd: Date;
  metrics: {
    totalRevenue: number;
    billableHours: number;
    casesHandled: number;
    clientSatisfaction: number;
    marketplaceBookings: number;
    cleHoursCompleted: number;
  };
}