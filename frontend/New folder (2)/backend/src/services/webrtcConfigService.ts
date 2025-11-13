import { logger } from '../utils/logger';

export interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface WebRTCConfig {
  iceServers: ICEServer[];
  iceTransportPolicy?: 'all' | 'relay';
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
  rtcpMuxPolicy?: 'negotiate' | 'require';
  iceCandidatePoolSize?: number;
}

export interface VideoConstraints {
  maxBitrate: number;
  minBitrate: number;
  maxFramerate: number;
  width: { min: number; max: number };
  height: { min: number; max: number };
}

export interface AudioConstraints {
  maxBitrate: number;
  minBitrate: number;
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface QualityProfile {
  name: string;
  video: VideoConstraints;
  audio: AudioConstraints;
}

class WebRTCConfigurationService {
  private iceServers: ICEServer[] = [];
  private qualityProfiles: Map<string, QualityProfile> = new Map();

  constructor() {
    this.initializeICEServers();
    this.initializeQualityProfiles();
  }

  private initializeICEServers(): void {
    // Google STUN servers (free)
    this.iceServers.push({
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    });

    // Add TURN servers if configured
    const turnUrl = process.env.TURN_SERVER_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnPassword = process.env.TURN_PASSWORD;

    if (turnUrl && turnUsername && turnPassword) {
      this.iceServers.push({
        urls: [turnUrl],
        username: turnUsername,
        credential: turnPassword
      });
      logger.info('TURN server configured for NAT traversal');
    }

    // Xirsys TURN servers (commercial)
    const xirsysUrl = process.env.XIRSYS_URL;
    const xirsysUsername = process.env.XIRSYS_USERNAME;
    const xirsysPassword = process.env.XIRSYS_PASSWORD;

    if (xirsysUrl && xirsysUsername && xirsysPassword) {
      this.iceServers.push({
        urls: [xirsysUrl],
        username: xirsysUsername,
        credential: xirsysPassword
      });
      logger.info('Xirsys TURN server configured');
    }

    // Coturn server (self-hosted)
    const coturnUrl = process.env.COTURN_URL;
    if (coturnUrl) {
      this.iceServers.push({
        urls: [coturnUrl],
        username: turnUsername || 'wakili-user',
        credential: turnPassword || 'wakili-pass'
      });
      logger.info('Coturn server configured');
    }

    logger.info(`WebRTC configured with ${this.iceServers.length} ICE servers`);
  }

  private initializeQualityProfiles(): void {
    // Low quality profile (mobile/poor connection)
    this.qualityProfiles.set('low', {
      name: 'Low Quality',
      video: {
        maxBitrate: 300000, // 300kbps
        minBitrate: 100000, // 100kbps
        maxFramerate: 15,
        width: { min: 320, max: 480 },
        height: { min: 240, max: 360 }
      },
      audio: {
        maxBitrate: 32000, // 32kbps
        minBitrate: 16000, // 16kbps
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Medium quality profile (standard desktop)
    this.qualityProfiles.set('medium', {
      name: 'Medium Quality',
      video: {
        maxBitrate: 800000, // 800kbps
        minBitrate: 300000, // 300kbps
        maxFramerate: 24,
        width: { min: 640, max: 960 },
        height: { min: 480, max: 720 }
      },
      audio: {
        maxBitrate: 64000, // 64kbps
        minBitrate: 32000, // 32kbps
        sampleRate: 44100,
        channelCount: 2,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // High quality profile (good connection/desktop)
    this.qualityProfiles.set('high', {
      name: 'High Quality',
      video: {
        maxBitrate: 1500000, // 1.5Mbps
        minBitrate: 500000,  // 500kbps
        maxFramerate: 30,
        width: { min: 960, max: 1920 },
        height: { min: 720, max: 1080 }
      },
      audio: {
        maxBitrate: 128000, // 128kbps
        minBitrate: 64000,  // 64kbps
        sampleRate: 48000,
        channelCount: 2,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false
      }
    });

    // Screen sharing profile (optimized for screen content)
    this.qualityProfiles.set('screen', {
      name: 'Screen Sharing',
      video: {
        maxBitrate: 2000000, // 2Mbps
        minBitrate: 800000,  // 800kbps
        maxFramerate: 15,    // Lower framerate for screen content
        width: { min: 1280, max: 3840 },
        height: { min: 720, max: 2160 }
      },
      audio: {
        maxBitrate: 128000,
        minBitrate: 64000,
        sampleRate: 48000,
        channelCount: 2,
        echoCancellation: false, // Don't cancel system audio
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    logger.info(`Initialized ${this.qualityProfiles.size} video quality profiles`);
  }

  /**
   * Get WebRTC peer connection configuration
   */
  getWebRTCConfig(forceRelay = false): WebRTCConfig {
    return {
      iceServers: this.iceServers,
      iceTransportPolicy: forceRelay ? 'relay' : 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 10
    };
  }

  /**
   * Get media constraints for specific quality profile
   */
  getMediaConstraints(qualityProfile: string = 'medium', isScreenShare: boolean = false): any {
    const profile = isScreenShare ? 
      this.qualityProfiles.get('screen') : 
      this.qualityProfiles.get(qualityProfile) || this.qualityProfiles.get('medium');

    if (!profile) {
      throw new Error(`Quality profile '${qualityProfile}' not found`);
    }

    return {
      video: isScreenShare ? true : {
        width: profile.video.width,
        height: profile.video.height,
        frameRate: { max: profile.video.maxFramerate },
        facingMode: 'user'
      },
      audio: {
        sampleRate: profile.audio.sampleRate,
        channelCount: profile.audio.channelCount,
        echoCancellation: profile.audio.echoCancellation,
        noiseSuppression: profile.audio.noiseSuppression,
        autoGainControl: profile.audio.autoGainControl
      }
    };
  }

  /**
   * Get display media constraints for screen sharing
   */
  getDisplayMediaConstraints(): any {
    const screenProfile = this.qualityProfiles.get('screen')!;
    
    return {
      video: {
        width: screenProfile.video.width,
        height: screenProfile.video.height,
        frameRate: { max: screenProfile.video.maxFramerate }
      },
      audio: {
        sampleRate: screenProfile.audio.sampleRate,
        channelCount: screenProfile.audio.channelCount,
        echoCancellation: false,
        noiseSuppression: false
      }
    };
  }

  /**
   * Get quality profile details
   */
  getQualityProfile(name: string): QualityProfile | undefined {
    return this.qualityProfiles.get(name);
  }

  /**
   * Get all available quality profiles
   */
  getAllQualityProfiles(): QualityProfile[] {
    return Array.from(this.qualityProfiles.values());
  }

  /**
   * Automatically determine best quality profile based on connection
   */
  getAdaptiveQualityProfile(
    connectionType: string = 'unknown', 
    participantCount: number = 2
  ): string {
    // Reduce quality with more participants
    if (participantCount > 4) {
      return 'low';
    }

    // Adapt based on connection type (if available)
    switch (connectionType.toLowerCase()) {
      case 'cellular':
      case '3g':
      case 'slow-2g':
        return 'low';
      case '4g':
      case 'wifi':
        return participantCount > 2 ? 'medium' : 'high';
      case 'ethernet':
      case '5g':
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Get RTP encoding parameters for simulcast
   */
  getSimulcastEncodings(): any[] {
    return [
      {
        rid: 'high',
        maxBitrate: 1500000,
        scaleResolutionDownBy: 1.0
      },
      {
        rid: 'medium', 
        maxBitrate: 800000,
        scaleResolutionDownBy: 2.0
      },
      {
        rid: 'low',
        maxBitrate: 300000,
        scaleResolutionDownBy: 4.0
      }
    ];
  }

  /**
   * Get ICE server configuration for frontend
   */
  getICEServersForClient(): ICEServer[] {
    return this.iceServers;
  }
}

export const webrtcConfig = new WebRTCConfigurationService();