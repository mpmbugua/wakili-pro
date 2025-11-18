import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Use Express.Multer.File for Multer file type


const prisma = new PrismaClient();

export interface RecordingMetadata {
  consultationId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  duration: number;
  format: string;
  codec: string;
  resolution: string;
  uploadUrl?: string;
  downloadUrl?: string;
}
export interface StorageProvider {
  upload(file: Express.Multer.File, metadata: RecordingMetadata): Promise<string>;
  getDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
}

// AWS S3 Storage Provider
class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucketName: string;
  private prefix: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'wakili-pro-recordings';
    this.prefix = process.env.AWS_S3_RECORDINGS_PREFIX || 'consultations/recordings/';
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    logger.info('S3 storage provider initialized');
  }

  async upload(file: Express.Multer.File, metadata: RecordingMetadata): Promise<string> {
    const key = `${this.prefix}${metadata.consultationId}/${metadata.fileName}`;
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fs.createReadStream(file.path),
          ContentType: file.mimetype,
          Metadata: {
            consultationId: metadata.consultationId,
            duration: metadata.duration.toString(),
            resolution: metadata.resolution,
            codec: metadata.codec,
            originalName: file.originalname
          }
        }
      });
      await upload.done();
      logger.info(`Recording uploaded to S3: ${key}`);
      return key;
    } catch (error) {
      logger.error('S3 upload failed:', error);
      throw new Error('Failed to upload recording to S3');
    }
  }

  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Failed to generate S3 download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`Recording deleted from S3: ${key}`);
    } catch (error) {
      logger.error('Failed to delete from S3:', error);
      throw new Error('Failed to delete recording');
    }
  }
}

// CloudFlare R2 Storage Provider (S3-compatible)
class R2StorageProvider implements StorageProvider {
  private r2Client: S3Client;
  private bucketName: string;
  constructor() {
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET || 'wakili-recordings';
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || 
      `https://${accountId}.r2.cloudflarestorage.com`;
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
      },
    });
    logger.info('CloudFlare R2 storage provider initialized');
  }

  async upload(file: Express.Multer.File, metadata: RecordingMetadata): Promise<string> {
    const key = `consultations/${metadata.consultationId}/${metadata.fileName}`;
    try {
      const upload = new Upload({
        client: this.r2Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fs.createReadStream(file.path),
          ContentType: file.mimetype,
          Metadata: {
            consultationId: metadata.consultationId,
            duration: metadata.duration.toString(),
            resolution: metadata.resolution,
            codec: metadata.codec
          }
        }
      });
      await upload.done();
      logger.info(`Recording uploaded to R2: ${key}`);
      return key;
    } catch (error) {
      logger.error('R2 upload failed:', error);
      throw new Error('Failed to upload recording to R2');
    }
  }

  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const url = await getSignedUrl(this.r2Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Failed to generate R2 download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.r2Client.send(command);
      logger.info(`Recording deleted from R2: ${key}`);
    } catch (error) {
      logger.error('Failed to delete from R2:', error);
      throw new Error('Failed to delete recording');
    }
  }
}

// Local Storage Provider (for development)
class LocalStorageProvider implements StorageProvider {
  private storagePath: string;

  constructor() {
    this.storagePath = path.join(process.cwd(), 'storage', 'recordings');
    
    // Ensure storage directory exists
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }

    logger.info('Local storage provider initialized');
  }

  async upload(file: Express.Multer.File, metadata: RecordingMetadata): Promise<string> {
    const consultationDir = path.join(this.storagePath, metadata.consultationId);
    
    if (!fs.existsSync(consultationDir)) {
      fs.mkdirSync(consultationDir, { recursive: true });
    }

    const destPath = path.join(consultationDir, metadata.fileName);
    
    try {
      fs.copyFileSync(file.path, destPath);
      logger.info(`Recording saved locally: ${destPath}`);
      
      return `consultations/${metadata.consultationId}/${metadata.fileName}`;
    } catch (error) {
      logger.error('Local storage failed:', error);
      throw new Error('Failed to save recording locally');
    }
  }

  async getDownloadUrl(key: string): Promise<string> {
    // Return a relative URL for local development
    return `/api/recordings/download/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.storagePath, key);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Recording deleted locally: ${filePath}`);
      }
    } catch (error) {
      logger.error('Failed to delete local file:', error);
      throw new Error('Failed to delete recording');
    }
  }
}

// Main Recording Service
export class RecordingService {
  private storageProvider: StorageProvider;
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'recordings');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Initialize storage provider based on environment
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.storageProvider = new S3StorageProvider();
    } else if (process.env.CLOUDFLARE_R2_ACCESS_KEY && process.env.CLOUDFLARE_R2_SECRET_KEY) {
      this.storageProvider = new R2StorageProvider();
    } else {
      this.storageProvider = new LocalStorageProvider();
      logger.warn('Using local storage for recordings - not recommended for production');
    }
  }

  /**
   * Start recording for a consultation
   */
  async startRecording(consultationId: string): Promise<void> {
    try {
      // Update consultation to mark recording as started
      await prisma.videoConsultation.update({
        where: { id: consultationId },
        data: { 
          isRecorded: true
        }
      });

      logger.info(`Recording started for consultation: ${consultationId}`);
    } catch (error) {
      logger.error('Failed to start recording:', error);
      throw new Error('Failed to start recording');
    }
  }

  /**
   * Stop recording for a consultation
   */
  async stopRecording(consultationId: string): Promise<void> {
    try {
      await prisma.videoConsultation.update({
        where: { id: consultationId },
        data: { }
      });

      logger.info(`Recording stopped for consultation: ${consultationId}`);
    } catch (error) {
      logger.error('Failed to stop recording:', error);
      throw new Error('Failed to stop recording');
    }
  }

  /**
   * Upload a recorded video file
   */
  async uploadRecording(
    consultationId: string,
    file: Express.Multer.File,
    metadata: Partial<RecordingMetadata> = {}
  ): Promise<string> {
    const recordingId = uuidv4();
    const fileName = `${recordingId}_${Date.now()}.${metadata.format || 'webm'}`;
    
    const fullMetadata: RecordingMetadata = {
      consultationId,
      fileName,
      filePath: file.path,
      fileSize: file.size,
      duration: metadata.duration || 0,
      format: metadata.format || 'webm',
      codec: metadata.codec || 'VP9',
      resolution: metadata.resolution || '1280x720',
      ...metadata
    };

    try {
      // Upload to storage provider
      const storageKey = await this.storageProvider.upload(file, fullMetadata);
      
      // Save recording metadata to database
      await prisma.consultationRecording.create({
        data: {
          id: recordingId,
          consultationId,
          url: file.path,
          startedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Clean up temporary file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      logger.info(`Recording uploaded successfully: ${recordingId}`);
      return recordingId;

    } catch (error) {
      logger.error('Failed to upload recording:', error);
      // Clean up on failure
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error('Failed to upload recording');
    }
  }

  /**
   * Get download URL for a recording
   */
  async getRecordingDownloadUrl(recordingId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const recording = await prisma.consultationRecording.findUnique({
        where: { id: recordingId }
      });
      if (!recording) {
        throw new Error('Recording not found');
      }
      return await this.storageProvider.getDownloadUrl(recording.url, expiresIn);
    } catch (error) {
      logger.error('Failed to get download URL:', error);
      throw new Error('Failed to get recording download URL');
    }
  }

  /**
   * Get consultation recordings
   */
  async getConsultationRecordings(consultationId: string): Promise<import('@prisma/client').ConsultationRecording[]> {
    try {
      return await prisma.consultationRecording.findMany({
        where: { consultationId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Failed to get consultation recordings:', error);
      throw new Error('Failed to get recordings');
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      const recording = await prisma.consultationRecording.findUnique({
        where: { id: recordingId }
      });

      if (!recording) {
        throw new Error('Recording not found');
      }

      // Delete from storage
      await this.storageProvider.deleteFile(recording.url);

      // Delete from database
      await prisma.consultationRecording.delete({
        where: { id: recordingId }
      });

      logger.info(`Recording deleted: ${recordingId}`);
    } catch (error) {
      logger.error('Failed to delete recording:', error);
      throw new Error('Failed to delete recording');
    }
  }

  /**
   * Get temporary upload path for recording chunks
   */
  getTempFilePath(consultationId: string, chunkIndex: number = 0): string {
    const fileName = `${consultationId}_chunk_${chunkIndex}_${Date.now()}.webm`;
    return path.join(this.tempDir, fileName);
  }

  /**
   * Cleanup old temporary files
   */
  async cleanupTempFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = fs.readdirSync(this.tempDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up temp file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup temp files:', error);
    }
  }
}

export const recordingService = new RecordingService();