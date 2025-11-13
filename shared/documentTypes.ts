// Shared types for document management

export interface LegalDocument {
  id: string;
  caseId?: string;
  ownerId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  description?: string;
}
