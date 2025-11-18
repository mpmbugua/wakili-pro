// DocumentTemplate type for backend AI document generator compatibility
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
