import QRCode from 'qrcode';
import { uploadQRCode } from './fileUploadService';

/**
 * Generate QR code for certificate verification and upload to Cloudinary
 */
export const generateVerificationQRCode = async (
  certificateId: string,
  baseUrl: string = process.env.FRONTEND_URL || 'https://wakili-pro.com'
): Promise<string> => {
  try {
    // Create verification URL
    const verificationUrl = `${baseUrl}/verify/${certificateId}`;
    
    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      width: 300
    });
    
    // Upload to Cloudinary
    const fileName = `qr-${certificateId}.png`;
    const uploadResult = await uploadQRCode(qrCodeBuffer, fileName, certificateId);
    
    // Return Cloudinary URL
    return uploadResult.url;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate verification QR code');
  }
};

/**
 * Generate QR code as data URL (for embedding in PDFs)
 */
export const generateQRCodeDataUrl = async (
  certificateId: string,
  baseUrl: string = process.env.FRONTEND_URL || 'https://wakili-pro.com'
): Promise<string> => {
  try {
    const verificationUrl = `${baseUrl}/verify/${certificateId}`;
    
    return await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300
    });
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw new Error('Failed to generate QR code');
  }
};
