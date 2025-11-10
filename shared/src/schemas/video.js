"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoSettingsUpdateSchema = exports.MeetingAnalyticsSchema = exports.VideoQualitySchema = exports.MeetingControlSchema = exports.ScreenShareRequestSchema = exports.WebRTCSignalSchema = exports.UpdateParticipantStatusSchema = exports.JoinVideoConsultationSchema = exports.CreateVideoConsultationSchema = exports.ConnectionStatusSchema = exports.ParticipantTypeSchema = exports.VideoConsultationStatusSchema = void 0;
const zod_1 = require("zod");
// Video Consultation Status Types
exports.VideoConsultationStatusSchema = zod_1.z.enum([
    'SCHEDULED',
    'WAITING_FOR_PARTICIPANTS',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
]);
exports.ParticipantTypeSchema = zod_1.z.enum([
    'LAWYER',
    'CLIENT',
    'OBSERVER'
]);
exports.ConnectionStatusSchema = zod_1.z.enum([
    'DISCONNECTED',
    'CONNECTING',
    'CONNECTED',
    'RECONNECTING',
    'FAILED'
]);
// Create Video Consultation Schema
exports.CreateVideoConsultationSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
    scheduledAt: zod_1.z.string().datetime('Invalid scheduled time'),
    isRecorded: zod_1.z.boolean().default(false),
    meetingNotes: zod_1.z.string().max(2000, 'Meeting notes too long').optional(),
});
// Join Video Consultation Schema  
exports.JoinVideoConsultationSchema = zod_1.z.object({
    consultationId: zod_1.z.string().min(1, 'Consultation ID is required'),
    participantType: exports.ParticipantTypeSchema,
    hasVideo: zod_1.z.boolean().default(true),
    hasAudio: zod_1.z.boolean().default(true),
});
// Update Participant Status Schema
exports.UpdateParticipantStatusSchema = zod_1.z.object({
    hasVideo: zod_1.z.boolean().optional(),
    hasAudio: zod_1.z.boolean().optional(),
    isScreenSharing: zod_1.z.boolean().optional(),
    connectionStatus: exports.ConnectionStatusSchema.optional(),
});
// WebRTC Signaling Schema
exports.WebRTCSignalSchema = zod_1.z.object({
    consultationId: zod_1.z.string().min(1, 'Consultation ID is required'),
    targetUserId: zod_1.z.string().min(1, 'Target user ID is required'),
    targetSocketId: zod_1.z.string().optional(),
    signal: zod_1.z.object({
        type: zod_1.z.enum(['offer', 'answer', 'ice-candidate']),
        data: zod_1.z.any() // WebRTC signal data
    })
});
// Screen Share Request Schema
exports.ScreenShareRequestSchema = zod_1.z.object({
    consultationId: zod_1.z.string().min(1, 'Consultation ID is required'),
    roomId: zod_1.z.string().min(1, 'Room ID is required'),
    isSharing: zod_1.z.boolean(),
    streamId: zod_1.z.string().optional()
});
// Meeting Control Schema
exports.MeetingControlSchema = zod_1.z.object({
    consultationId: zod_1.z.string().min(1, 'Consultation ID is required'),
    action: zod_1.z.enum(['mute_participant', 'remove_participant', 'end_meeting', 'start_recording', 'stop_recording']),
    targetUserId: zod_1.z.string().optional(), // For participant-specific actions
});
// Video Quality Settings Schema
exports.VideoQualitySchema = zod_1.z.object({
    video: zod_1.z.object({
        width: zod_1.z.number().min(320).max(1920).default(1280),
        height: zod_1.z.number().min(240).max(1080).default(720),
        frameRate: zod_1.z.number().min(15).max(60).default(30),
    }).optional(),
    audio: zod_1.z.object({
        sampleRate: zod_1.z.number().min(8000).max(48000).default(44100),
        channelCount: zod_1.z.number().min(1).max(2).default(1),
    }).optional()
});
// Meeting Analytics Schema
exports.MeetingAnalyticsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().min(1, 'Consultation ID is required'),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    includeParticipantStats: zod_1.z.boolean().default(true),
    includeQualityMetrics: zod_1.z.boolean().default(true),
});
// Video Settings Update Schema
exports.VideoSettingsUpdateSchema = zod_1.z.object({
    consultationId: zod_1.z.string(),
    hasVideo: zod_1.z.boolean(),
    hasAudio: zod_1.z.boolean()
});
