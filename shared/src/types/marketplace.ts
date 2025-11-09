export type ServiceType = 
  | 'CONSULTATION' 
  | 'DOCUMENT_DRAFTING' 
  | 'LEGAL_REVIEW' 
  | 'IP_FILING' 
  | 'DISPUTE_MEDIATION'
  | 'CONTRACT_NEGOTIATION';

export type ServiceStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface MarketplaceService {
  id: string;
  type: ServiceType;
  title: string;
  description: string;
  providerId: string;
  priceKES: number;
  duration?: number; // For consultations (minutes)
  deliveryTimeframe?: string; // "2-3 business days"
  rating: number;
  reviewCount: number;
  status: ServiceStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  scheduledAt?: Date; // For consultations
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmountKES: number;
  clientRequirements: string;
  providerNotes?: string;
  deliverables?: BookingDeliverable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingDeliverable {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ServiceReview {
  id: string;
  serviceId: string;
  authorId: string;
  targetId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceFilters {
  type?: ServiceType;
  location?: { 
    latitude: number; 
    longitude: number; 
    radius: number; 
  };
  priceRange?: { 
    min: number; 
    max: number; 
  };
  specialization?: string;
  rating?: number;
}