// Shared types for calendar and appointments

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  userId: string;
  caseId?: string;
  start: string;
  end: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
}
