export type UserRole = 'PUBLIC' | 'LAWYER' | 'ADMIN';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type SubscriptionTier = 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  profile?: UserProfile;
  lawyerProfile?: LawyerProfile;
  subscription?: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  avatarUrl?: string;
  county?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LawyerProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  yearOfAdmission: number;
  specializations: LegalSpecialization[];
  location: LocationData;
  bio: string;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  profileImageUrl?: string;
  availability: WorkingHours[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalSpecialization {
  id: string;
  name: string;
  category: 'CORPORATE' | 'CRIMINAL' | 'FAMILY' | 'PROPERTY' | 'IMMIGRATION' | 'IP' | 'EMPLOYMENT';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  county: string;
}

export interface WorkingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isAvailable: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  priceKES: number;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}