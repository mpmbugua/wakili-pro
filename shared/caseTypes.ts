// Shared types for legal case management

export type CaseStatus = 'open' | 'in_progress' | 'closed' | 'on_hold';

export interface Case {
  id: string;
  title: string;
  description: string;
  clientId: string;
  lawyerId: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CaseAssignment {
  caseId: string;
  lawyerId: string;
  assignedAt: string;
}
