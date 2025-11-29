import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload file to Cloudinary
 * @param fileBuffer - File buffer from multer
 * @param fileName - Original file name
 * @param folder - Cloudinary folder path
 * @returns Upload result with URL and metadata
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'user-documents'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto', // Automatically detect file type
        public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`, // Remove extension
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload file to cloud storage'));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileName: fileName,
            fileSize: result.bytes,
            mimeType: result.format || 'application/octet-stream',
          });
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Deletion result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete file from cloud storage');
  }
};

/**
 * Get signed URL for temporary access (optional, for private documents)
 * @param publicId - Cloudinary public ID
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export const getSignedUrl = (publicId: string, expiresIn: number = 3600): string => {
  const timestamp = Math.round(Date.now() / 1000) + expiresIn;
  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    expires_at: timestamp,
  });
};

/**
 * Validate file type
 * @param mimeType - File MIME type
 * @returns True if valid
 */
export const isValidDocumentType = (mimeType: string): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'text/plain',
  ];
  return allowedTypes.includes(mimeType);
};

/**
 * Validate file size (max 20MB)
 * @param fileSize - File size in bytes
 * @returns True if valid
 */
export const isValidFileSize = (fileSize: number): boolean => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  return fileSize <= maxSize;
};

/**
 * Validate image file type (for profile photos, signatures, stamps)
 * @param mimeType - File MIME type
 * @returns True if valid image
 */
export const isValidImageType = (mimeType: string): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  return allowedTypes.includes(mimeType);
};

/**
 * Validate video file type (for consultations, recordings)
 * @param mimeType - File MIME type
 * @returns True if valid video
 */
export const isValidVideoType = (mimeType: string): boolean => {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ];
  return allowedTypes.includes(mimeType);
};

/**
 * Upload profile photo to Cloudinary
 */
export const uploadProfilePhoto = async (
  fileBuffer: Buffer,
  fileName: string,
  userId: string
): Promise<UploadResult> => {
  return uploadToCloudinary(fileBuffer, fileName, `wakili-pro/profile-photos/${userId}`);
};

/**
 * Upload lawyer signature to Cloudinary
 */
export const uploadSignature = async (
  fileBuffer: Buffer,
  fileName: string,
  lawyerId: string
): Promise<UploadResult> => {
  return uploadToCloudinary(fileBuffer, fileName, `wakili-pro/lawyer-signatures/${lawyerId}`);
};

/**
 * Upload lawyer stamp to Cloudinary
 */
export const uploadStamp = async (
  fileBuffer: Buffer,
  fileName: string,
  lawyerId: string
): Promise<UploadResult> => {
  return uploadToCloudinary(fileBuffer, fileName, `wakili-pro/lawyer-stamps/${lawyerId}`);
};

/**
 * Upload lawyer letterhead to Cloudinary
 */
export const uploadLetterhead = async (
  fileBuffer: Buffer,
  fileName: string,
  lawyerId: string
): Promise<UploadResult> => {
  return uploadToCloudinary(fileBuffer, fileName, `wakili-pro/letterheads/${lawyerId}`);
};

/**
 * Upload certificate to Cloudinary
 */
export const uploadCertificate = async (
  fileBuffer: Buffer,
  fileName: string,
  userId: string
): Promise<UploadResult> => {
  return uploadToCloudinary(fileBuffer, fileName, `wakili-pro/certificates/${userId}`);
};

/**
 * Upload QR code to Cloudinary
 */
export const uploadQRCode = async (
  fileBuffer: Buffer,
  fileName: string,
  documentId: string
): Promise<UploadResult> => {
  return uploadToCloudinary(fileBuffer, fileName, `wakili-pro/qr-codes/${documentId}`);
};

/**
 * Upload video recording to Cloudinary
 */
export const uploadVideoRecording = async (
  fileBuffer: Buffer,
  fileName: string,
  consultationId: string
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `wakili-pro/video-recordings/${consultationId}`,
        resource_type: 'video',
        public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`,
        use_filename: true,
        unique_filename: true,
        chunk_size: 6000000, // 6MB chunks for large videos
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary video upload error:', error);
          reject(new Error('Failed to upload video to cloud storage'));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileName: fileName,
            fileSize: result.bytes,
            mimeType: result.format || 'video/mp4',
          });
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Upload document review file to Cloudinary
 */
export const uploadDocumentReview = async (
  fileBuffer: Buffer,
  fileName: string,
  reviewId: string
): Promise<UploadResult> => {
  return uploadToCloudinary(fileBuffer, fileName, `wakili-pro/document-reviews/${reviewId}`);
};
