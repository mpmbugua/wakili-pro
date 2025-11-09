import { z } from 'zod';

// Video Consultation Status Types
export const VideoConsultationStatusSchema = z.enum([
  'SCHEDULED',
  'WAITING_FOR_PARTICIPANTS', 
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
]);

export const ParticipantTypeSchema = z.enum([
  'LAWYER',
  'CLIENT',
  'OBSERVER'
]);

export const ConnectionStatusSchema = z.enum([
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'RECONNECTING',
  'FAILED'
]);

// Create Video Consultation Schema
export const CreateVideoConsultationSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  scheduledAt: z.string().datetime('Invalid scheduled time'),
  isRecorded: z.boolean().default(false),
  meetingNotes: z.string().max(2000, 'Meeting notes too long').optional(),
});

// Join Video Consultation Schema  
export const JoinVideoConsultationSchema = z.object({
  consultationId: z.string().min(1, 'Consultation ID is required'),
  participantType: ParticipantTypeSchema,
  hasVideo: z.boolean().default(true),
  hasAudio: z.boolean().default(true),
});

// Update Participant Status Schema
export const UpdateParticipantStatusSchema = z.object({
  hasVideo: z.boolean().optional(),
  hasAudio: z.boolean().optional(),
  isScreenSharing: z.boolean().optional(),
  connectionStatus: ConnectionStatusSchema.optional(),
});

// WebRTC Signaling Schema
export const WebRTCSignalSchema = z.object({
  consultationId: z.string().min(1, 'Consultation ID is required'),
  targetUserId: z.string().min(1, 'Target user ID is required'),
  targetSocketId: z.string().optional(),
  signal: z.object({
    type: z.enum(['offer', 'answer', 'ice-candidate']),
    data: z.any() // WebRTC signal data
  })
});

// Screen Share Request Schema
export const ScreenShareRequestSchema = z.object({
  consultationId: z.string().min(1, 'Consultation ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  isSharing: z.boolean(),
  streamId: z.string().optional()
});

// Meeting Control Schema
export const MeetingControlSchema = z.object({
  consultationId: z.string().min(1, 'Consultation ID is required'),
  action: z.enum(['mute_participant', 'remove_participant', 'end_meeting', 'start_recording', 'stop_recording']),
  targetUserId: z.string().optional(), // For participant-specific actions
});

// Video Quality Settings Schema
export const VideoQualitySchema = z.object({
  video: z.object({
    width: z.number().min(320).max(1920).default(1280),
    height: z.number().min(240).max(1080).default(720),
    frameRate: z.number().min(15).max(60).default(30),
  }).optional(),
  audio: z.object({
    sampleRate: z.number().min(8000).max(48000).default(44100),
    channelCount: z.number().min(1).max(2).default(1),
  }).optional()
});

// Meeting Analytics Schema
export const MeetingAnalyticsSchema = z.object({
  consultationId: z.string().min(1, 'Consultation ID is required'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeParticipantStats: z.boolean().default(true),
  includeQualityMetrics: z.boolean().default(true),
});

// Video Settings Update Schema
export const VideoSettingsUpdateSchema = z.object({
  consultationId: z.string(),
  hasVideo: z.boolean(),
  hasAudio: z.boolean()
});

// Export types
export type VideoConsultationStatus = z.infer<typeof VideoConsultationStatusSchema>;
export type ParticipantType = z.infer<typeof ParticipantTypeSchema>;
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;
export type CreateVideoConsultationData = z.infer<typeof CreateVideoConsultationSchema>;
export type JoinVideoConsultationData = z.infer<typeof JoinVideoConsultationSchema>;
export type UpdateParticipantStatusData = z.infer<typeof UpdateParticipantStatusSchema>;
export type WebRTCSignalData = z.infer<typeof WebRTCSignalSchema>;
export type ScreenShareRequestData = z.infer<typeof ScreenShareRequestSchema>;
export type MeetingControlData = z.infer<typeof MeetingControlSchema>;
export type VideoQualityData = z.infer<typeof VideoQualitySchema>;
export type MeetingAnalyticsData = z.infer<typeof MeetingAnalyticsSchema>;
export type VideoSettingsUpdateData = z.infer<typeof VideoSettingsUpdateSchema>;