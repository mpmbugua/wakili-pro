export interface LawyerMessage {
  id: string;
  lawyerId: string;
  sender: string;
  content: string;
  sentAt: string;
}

export interface LawyerReferral {
  id: string;
  lawyerId: string;
  referredLawyer: string;
  clientName: string;
  referredAt: string;
}

export interface ForumPost {
  id: string;
  author: string;
  title: string;
  content: string;
  createdAt: string;
}
