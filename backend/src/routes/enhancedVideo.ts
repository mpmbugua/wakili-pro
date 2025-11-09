import express from 'express';
import multer from 'multer';
import { 
  createVideoConsultation,
  joinVideoConsultation, 
  updateParticipantStatus,
  leaveVideoConsultation,
  getMyVideoConsultations,
  controlMeeting
} from '../controllers/videoController';
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimitMiddleware';
import { recordingService } from '../services/recordingService';
import { webrtcConfig } from '../services/webrtcConfigService';
import { performanceTestingService } from '../services/performanceTestingService';
import { mobileIntegrationService } from '../services/mobileIntegrationService';
import { logger } from '../utils/logger';

const router = express.Router();

// Configure multer for recording uploads
const upload = multer({
  dest: 'temp/recordings/',
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Apply authentication to all video routes
router.use(authenticateToken);

/**
 * @route   POST /api/video/consultations
 * @desc    Create a new video consultation for a booking
 * @access  Private (Client or Lawyer)
 */
router.post('/consultations', rateLimiter, createVideoConsultation);

/**
 * @route   POST /api/video/consultations/:id/join
 * @desc    Join a video consultation
 * @access  Private (Client or Lawyer)
 */
router.post('/consultations/:id/join', rateLimiter, joinVideoConsultation);

/**
 * @route   PATCH /api/video/consultations/:id/participant
 * @desc    Update participant status (audio/video settings, connection status)
 * @access  Private (Participant)
 */
router.patch('/consultations/:id/participant', updateParticipantStatus);

/**
 * @route   POST /api/video/consultations/:id/leave
 * @desc    Leave a video consultation
 * @access  Private (Participant)
 */
router.post('/consultations/:id/leave', leaveVideoConsultation);

/**
 * @route   GET /api/video/consultations
 * @desc    Get user's video consultations (as client or lawyer)
 * @access  Private
 */
router.get('/consultations', getMyVideoConsultations);

/**
 * @route   POST /api/video/consultations/control
 * @desc    Control meeting (end meeting, start/stop recording)
 * @access  Private (Lawyer only)
 */
router.post('/consultations/control', rateLimiter, controlMeeting);

// Enhanced Video Consultation Features

/**
 * @route   GET /api/video/config
 * @desc    Get WebRTC configuration (ICE servers, quality profiles)
 * @access  Private
 */
router.get('/config', async (_req, res) => {
  try {
    const config = {
      webrtc: webrtcConfig.getWebRTCConfig(),
      iceServers: webrtcConfig.getICEServersForClient(),
      qualityProfiles: webrtcConfig.getAllQualityProfiles(),
      mediaConstraints: {
        low: webrtcConfig.getMediaConstraints('low'),
        medium: webrtcConfig.getMediaConstraints('medium'),
        high: webrtcConfig.getMediaConstraints('high')
      },
      displayConstraints: webrtcConfig.getDisplayMediaConstraints(),
      simulcastEncodings: webrtcConfig.getSimulcastEncodings()
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to get video config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video configuration'
    });
  }
});

// Recording Management

/**
 * @route   POST /api/video/consultations/:id/recording/start
 * @desc    Start recording a consultation
 * @access  Private (Lawyer only)
 */
router.post('/consultations/:id/recording/start', async (req, res) => {
  try {
    const consultationId = req.params.id;
    
    await recordingService.startRecording(consultationId);
    
    res.json({
      success: true,
      message: 'Recording started successfully'
    });
  } catch (error) {
    logger.error('Failed to start recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start recording'
    });
  }
});

/**
 * @route   POST /api/video/consultations/:id/recording/stop
 * @desc    Stop recording a consultation
 * @access  Private (Lawyer only)
 */
router.post('/consultations/:id/recording/stop', async (req, res) => {
  try {
    const consultationId = req.params.id;
    
    await recordingService.stopRecording(consultationId);
    
    res.json({
      success: true,
      message: 'Recording stopped successfully'
    });
  } catch (error) {
    logger.error('Failed to stop recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording'
    });
  }
});

/**
 * @route   POST /api/video/recordings/upload
 * @desc    Upload a consultation recording
 * @access  Private
 */
router.post('/recordings/upload', upload.single('recording'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No recording file provided'
      });
    }

    const { consultationId, format, codec, resolution, duration } = req.body;
    
    const recordingId = await recordingService.uploadRecording(
      consultationId,
      req.file,
      {
        format: format || 'webm',
        codec: codec || 'VP9',
        resolution: resolution || '1280x720',
        duration: parseInt(duration) || 0
      }
    );

    res.json({
      success: true,
      data: { recordingId },
      message: 'Recording uploaded successfully'
    });
  } catch (error) {
    logger.error('Failed to upload recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload recording'
    });
  }
});

/**
 * @route   GET /api/video/consultations/:id/recordings
 * @desc    Get recordings for a consultation
 * @access  Private
 */
router.get('/consultations/:id/recordings', async (req, res) => {
  try {
    const consultationId = req.params.id;
    
    const recordings = await recordingService.getConsultationRecordings(consultationId);
    
    res.json({
      success: true,
      data: recordings
    });
  } catch (error) {
    logger.error('Failed to get recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recordings'
    });
  }
});

/**
 * @route   GET /api/video/recordings/:id/download
 * @desc    Get download URL for a recording
 * @access  Private
 */
router.get('/recordings/:id/download', async (req, res) => {
  try {
    const recordingId = req.params.id;
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;
    
    const downloadUrl = await recordingService.getRecordingDownloadUrl(recordingId, expiresIn);
    
    res.json({
      success: true,
      data: { downloadUrl },
      message: 'Download URL generated successfully'
    });
  } catch (error) {
    logger.error('Failed to generate download URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL'
    });
  }
});

/**
 * @route   DELETE /api/video/recordings/:id
 * @desc    Delete a recording
 * @access  Private (Lawyer only)
 */
router.delete('/recordings/:id', async (req, res) => {
  try {
    const recordingId = req.params.id;
    
    await recordingService.deleteRecording(recordingId);
    
    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recording'
    });
  }
});

// Performance Monitoring

/**
 * @route   GET /api/video/performance/metrics
 * @desc    Get current performance metrics
 * @access  Private (Admin only)
 */
router.get('/performance/metrics', async (_req, res) => {
  try {
    const metrics = performanceTestingService.getCurrentMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
});

/**
 * @route   GET /api/video/performance/report
 * @desc    Generate performance report
 * @access  Private (Admin only)
 */
router.get('/performance/report', async (req, res) => {
  try {
    const testId = req.query.testId as string;
    const report = performanceTestingService.generatePerformanceReport(testId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to generate performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report'
    });
  }
});

/**
 * @route   POST /api/video/performance/test/start
 * @desc    Start performance load test
 * @access  Private (Admin only)
 */
router.post('/performance/test/start', async (req, res) => {
  try {
    const config = req.body;
    const testId = await performanceTestingService.startLoadTest(config);
    
    res.json({
      success: true,
      data: { testId },
      message: 'Load test started successfully'
    });
  } catch (error) {
    logger.error('Failed to start load test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start load test'
    });
  }
});

/**
 * @route   POST /api/video/performance/test/:testId/stop
 * @desc    Stop performance load test
 * @access  Private (Admin only)
 */
router.post('/performance/test/:testId/stop', async (req, res) => {
  try {
    const testId = req.params.testId;
    await performanceTestingService.stopLoadTest(testId);
    
    res.json({
      success: true,
      message: 'Load test stopped successfully'
    });
  } catch (error) {
    logger.error('Failed to stop load test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop load test'
    });
  }
});

// Mobile Integration

/**
 * @route   POST /api/video/mobile/register-device
 * @desc    Register mobile device for push notifications
 * @access  Private
 */
router.post('/mobile/register-device', async (req, res) => {
  try {
    const { deviceToken, platform, appVersion } = req.body;
    const userId = (req as any).user?.id;
    
    if (!deviceToken || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Device token and platform are required'
      });
    }

    await mobileIntegrationService.registerDevice(
      userId,
      deviceToken,
      platform,
      appVersion || '1.0.0'
    );
    
    res.json({
      success: true,
      message: 'Device registered successfully'
    });
  } catch (error) {
    logger.error('Failed to register device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device'
    });
  }
});

/**
 * @route   GET /api/video/mobile/config
 * @desc    Get mobile app configuration
 * @access  Private
 */
router.get('/mobile/config', async (_req, res) => {
  try {
    const config = mobileIntegrationService.getMobileAppConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to get mobile config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mobile configuration'
    });
  }
});

/**
 * @route   POST /api/video/mobile/test-notification
 * @desc    Send test push notification
 * @access  Private
 */
router.post('/mobile/test-notification', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { title, body } = req.body;
    
    await mobileIntegrationService.sendNotificationToUser(userId, {
      title: title || 'Test Notification',
      body: body || 'This is a test push notification from Wakili Pro',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// Utility Routes

/**
 * @route   POST /api/video/cleanup-temp
 * @desc    Cleanup temporary recording files
 * @access  Private (Admin only)
 */
router.post('/cleanup-temp', async (req, res) => {
  try {
    const maxAgeHours = parseInt(req.body.maxAgeHours) || 24;
    await recordingService.cleanupTempFiles(maxAgeHours);
    
    res.json({
      success: true,
      message: 'Temporary files cleaned up successfully'
    });
  } catch (error) {
    logger.error('Failed to cleanup temp files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup temporary files'
    });
  }
});

export default router;