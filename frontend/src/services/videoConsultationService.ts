import { api } from './api';
import {
  CreateVideoConsultationData,
  JoinVideoConsultationData,
  UpdateParticipantStatusData,
  MeetingControlData
} from '../../../shared/src/schemas/video';

export interface VideoConsultation {
  id: string;
  bookingId: string;
  lawyerId: string;
  clientId: string;
  roomId: string;
  status: 'SCHEDULED' | 'WAITING_FOR_PARTICIPANTS' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  isRecorded: boolean;
  participantCount: number;
  meetingNotes?: string;
  booking: {
    service: {
      title: string;
      type: string;
      priceKES: number;
    };
  };
  lawyer: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  client: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  participants: Array<{
    participantType: 'HOST' | 'PARTICIPANT';
    joinedAt: string;
    leftAt?: string;
    connectionStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  }>;
}

export interface VideoConsultationResponse {
  consultation: VideoConsultation;
  participant: {
    id: string;
    participantType: 'HOST' | 'PARTICIPANT';
    hasVideo: boolean;
    hasAudio: boolean;
    connectionStatus: string;
  };
  roomId: string;
}

export interface PaginatedVideoConsultations {
  consultations: VideoConsultation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class VideoConsultationService {
  /**
   * Create a new video consultation for a booking
   */
  async createConsultation(data: CreateVideoConsultationData): Promise<VideoConsultation> {
    const response = await api.post<{
      success: boolean;
      data: VideoConsultation;
      message: string;
    }>('/video/consultations', data);

    return response.data.data;
  }

  /**
   * Join a video consultation
   */
  async joinConsultation(consultationId: string, data: JoinVideoConsultationData): Promise<VideoConsultationResponse> {
    const response = await api.post<{
      success: boolean;
      data: VideoConsultationResponse;
      message: string;
    }>(`/video/consultations/${consultationId}/join`, data);

    return response.data.data;
  }

  /**
   * Update participant status (video/audio settings)
   */
  async updateParticipantStatus(consultationId: string, data: UpdateParticipantStatusData): Promise<void> {
    await api.patch(`/video/consultations/${consultationId}/participant`, data);
  }

  /**
   * Leave a video consultation
   */
  async leaveConsultation(consultationId: string): Promise<void> {
    await api.post(`/video/consultations/${consultationId}/leave`);
  }

  /**
   * Get user's video consultations
   */
  async getMyConsultations(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<PaginatedVideoConsultations> {
    const response = await api.get<{
      success: boolean;
      data: PaginatedVideoConsultations;
    }>('/video/consultations', { params });

    return response.data.data;
  }

  /**
   * Get a specific video consultation
   */
  async getConsultation(consultationId: string): Promise<VideoConsultation> {
    const response = await api.get<{
      success: boolean;
      data: VideoConsultation;
    }>(`/video/consultations/${consultationId}`);

    return response.data.data;
  }

  /**
   * Control meeting (lawyer only)
   */
  async controlMeeting(data: MeetingControlData): Promise<void> {
    await api.post('/video/consultations/control', data);
  }

  /**
   * Get consultation by booking ID
   */
  async getConsultationByBooking(bookingId: string): Promise<VideoConsultation | null> {
    try {
      const consultations = await this.getMyConsultations();
      const consultation = consultations.consultations.find(c => c.bookingId === bookingId);
      return consultation || null;
    } catch (error) {
      console.error('Failed to get consultation by booking:', error);
      return null;
    }
  }

  /**
   * Check if video consultation exists for booking
   */
  async hasVideoConsultation(bookingId: string): Promise<boolean> {
    const consultation = await this.getConsultationByBooking(bookingId);
    return consultation !== null;
  }

  /**
   * Create video consultation from booking
   */
  async createFromBooking(bookingId: string, scheduledAt: Date, options: {
    isRecorded?: boolean;
    meetingNotes?: string;
  } = {}): Promise<VideoConsultation> {
    return this.createConsultation({
      bookingId,
      scheduledAt: scheduledAt.toISOString(),
      isRecorded: options.isRecorded || false,
      meetingNotes: options.meetingNotes
    });
  }

  /**
   * Get upcoming consultations
   */
  async getUpcomingConsultations(): Promise<VideoConsultation[]> {
    const consultations = await this.getMyConsultations({
      status: 'SCHEDULED'
    });

    return consultations.consultations
      .filter(c => new Date(c.scheduledAt) > new Date())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  /**
   * Get active consultations
   */
  async getActiveConsultations(): Promise<VideoConsultation[]> {
    const consultations = await this.getMyConsultations();

    return consultations.consultations.filter(c => 
      c.status === 'IN_PROGRESS' || c.status === 'WAITING_FOR_PARTICIPANTS'
    );
  }

  /**
   * Get consultation history
   */
  async getConsultationHistory(page: number = 1, limit: number = 10): Promise<PaginatedVideoConsultations> {
    return this.getMyConsultations({
      page,
      limit,
      status: 'COMPLETED'
    });
  }
}

export const videoConsultationService = new VideoConsultationService();