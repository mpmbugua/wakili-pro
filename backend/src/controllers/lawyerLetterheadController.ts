import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  uploadSignature as uploadSignatureToCloudinary, 
  uploadStamp as uploadStampToCloudinary, 
  uploadToCloudinary,
  isValidImageType, 
  deleteFromCloudinary 
} from '../services/fileUploadService';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

/**
 * Upload digital signature
 */
export const uploadSignature = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const file = req.file;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can upload signatures'
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Signature image is required'
      });
      return;
    }

    // Validate image type
    if (!isValidImageType(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PNG, JPEG, and JPG images are allowed.'
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadSignatureToCloudinary(file.buffer, file.originalname, userId);

    const signatureUrl = uploadResult.url;

    // Update or create letterhead
    const letterhead = await prisma.lawyerLetterhead.upsert({
      where: { lawyerId: userId },
      update: {
        signatureUrl,
        updatedAt: new Date()
      },
      create: {
        lawyerId: userId,
        signatureUrl,
        letterheadUrl: '', // Will be filled later
        firmName: req.body.firmName || 'Law Firm',
        licenseNumber: req.body.licenseNumber || 'TBD'
      }
    });

    res.json({
      success: true,
      message: 'Signature uploaded successfully',
      data: {
        signatureUrl: letterhead.signatureUrl,
        publicId: uploadResult.publicId
      }
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload signature'
    });
  }
};

/**
 * Upload digital stamp
 */
export const uploadStamp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const file = req.file;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can upload stamps'
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Stamp image is required'
      });
      return;
    }

    // Validate image type
    if (!isValidImageType(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PNG, JPEG, and JPG images are allowed.'
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadStampToCloudinary(file.buffer, file.originalname, userId);

    const stampUrl = uploadResult.url;

    // Update or create letterhead
    const letterhead = await prisma.lawyerLetterhead.upsert({
      where: { lawyerId: userId },
      update: {
        stampUrl,
        updatedAt: new Date()
      },
      create: {
        lawyerId: userId,
        stampUrl,
        letterheadUrl: '', // Will be filled later
        firmName: req.body.firmName || 'Law Firm',
        licenseNumber: req.body.licenseNumber || 'TBD'
      }
    });

    res.json({
      success: true,
      message: 'Stamp uploaded successfully',
      data: {
        stampUrl: letterhead.stampUrl,
        publicId: uploadResult.publicId
      }
    });
  } catch (error) {
    console.error('Upload stamp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload stamp'
    });
  }
};

/**
 * Update letterhead details (firm info)
 */
export const updateLetterheadDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can update letterhead'
      });
      return;
    }

    const {
      firmName,
      firmAddress,
      firmPhone,
      firmEmail,
      licenseNumber,
      certificatePrefix
    } = req.body;

    // License number is always required
    if (!licenseNumber) {
      res.status(400).json({
        success: false,
        message: 'License number is required'
      });
      return;
    }

    // Get current letterhead to check if using custom letterhead
    const currentLetterhead = await prisma.lawyerLetterhead.findUnique({
      where: { lawyerId: userId }
    });

    // Firm name is required only for system-generated letterhead
    if (!currentLetterhead?.useCustomLetterhead && !firmName) {
      res.status(400).json({
        success: false,
        message: 'Firm name is required for system-generated letterhead'
      });
      return;
    }

    // Update or create letterhead
    const letterhead = await prisma.lawyerLetterhead.upsert({
      where: { lawyerId: userId },
      update: {
        firmName: firmName || currentLetterhead?.firmName || '',
        firmAddress,
        firmPhone,
        firmEmail,
        licenseNumber,
        certificatePrefix: certificatePrefix || 'WP',
        updatedAt: new Date()
      },
      create: {
        lawyerId: userId,
        letterheadUrl: '', // Placeholder
        firmName,
        firmAddress,
        firmPhone,
        firmEmail,
        licenseNumber,
        certificatePrefix: certificatePrefix || 'WP'
      }
    });

    res.json({
      success: true,
      message: 'Letterhead details updated successfully',
      data: letterhead
    });
  } catch (error) {
    console.error('Update letterhead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update letterhead details'
    });
  }
};

/**
 * Get lawyer's letterhead
 */
export const getLetterhead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can access letterhead'
      });
      return;
    }

    const letterhead = await prisma.lawyerLetterhead.findUnique({
      where: { lawyerId: userId }
    });

    if (!letterhead) {
      res.status(404).json({
        success: false,
        message: 'Letterhead not found. Please set up your letterhead first.'
      });
      return;
    }

    res.json({
      success: true,
      data: letterhead
    });
  } catch (error) {
    console.error('Get letterhead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve letterhead'
    });
  }
};

/**
 * Delete signature
 */
export const deleteSignature = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const letterhead = await prisma.lawyerLetterhead.findUnique({
      where: { lawyerId: userId }
    });

    if (!letterhead || !letterhead.signatureUrl) {
      res.status(404).json({
        success: false,
        message: 'No signature found'
      });
      return;
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (letterhead.signatureUrl.includes('cloudinary')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = letterhead.signatureUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileName}`;
        
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Continue even if Cloudinary delete fails
      }
    }

    // Update database
    await prisma.lawyerLetterhead.update({
      where: { lawyerId: userId },
      data: { signatureUrl: null }
    });

    res.json({
      success: true,
      message: 'Signature deleted successfully'
    });
  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete signature'
    });
  }
};

/**
 * Delete stamp
 */
export const deleteStamp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const letterhead = await prisma.lawyerLetterhead.findUnique({
      where: { lawyerId: userId }
    });

    if (!letterhead || !letterhead.stampUrl) {
      res.status(404).json({
        success: false,
        message: 'No stamp found'
      });
      return;
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (letterhead.stampUrl.includes('cloudinary')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = letterhead.stampUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileName}`;
        
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Continue even if Cloudinary delete fails
      }
    }

    // Update database
    await prisma.lawyerLetterhead.update({
      where: { lawyerId: userId },
      data: { stampUrl: null }
    });

    res.json({
      success: true,
      message: 'Stamp deleted successfully'
    });
  } catch (error) {
    console.error('Delete stamp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stamp'
    });
  }
};

/**
 * Upload letterhead template (PDF or image with header/footer)
 */
export const uploadLetterheadTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const file = req.file;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can upload letterhead templates'
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Letterhead template file is required'
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF, PNG, and JPG files are allowed.'
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      file.originalname,
      `wakili-pro/letterheads/${userId}`
    );

    const customLetterheadUrl = uploadResult.url;

    // Update or create letterhead
    const letterhead = await prisma.lawyerLetterhead.upsert({
      where: { lawyerId: userId },
      update: {
        customLetterheadUrl,
        useCustomLetterhead: true,
        updatedAt: new Date()
      },
      create: {
        lawyerId: userId,
        letterheadUrl: '', // Placeholder for backward compatibility
        customLetterheadUrl,
        useCustomLetterhead: true,
        firmName: '',
        licenseNumber: '',
        certificatePrefix: 'WP'
      }
    });

    res.json({
      success: true,
      message: 'Letterhead template uploaded successfully',
      data: letterhead
    });
  } catch (error) {
    console.error('Upload letterhead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload letterhead template'
    });
  }
};

/**
 * Delete letterhead template
 */
export const deleteLetterheadTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can delete letterhead templates'
      });
      return;
    }

    const letterhead = await prisma.lawyerLetterhead.findUnique({
      where: { lawyerId: userId }
    });

    if (!letterhead) {
      res.status(404).json({
        success: false,
        message: 'No letterhead found'
      });
      return;
    }

    // Check for both customLetterheadUrl (new) and letterheadUrl (legacy)
    const templateUrl = letterhead.customLetterheadUrl || letterhead.letterheadUrl;
    
    if (!templateUrl) {
      res.status(404).json({
        success: false,
        message: 'No letterhead template found'
      });
      return;
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (templateUrl.includes('cloudinary')) {
      try {
        const urlParts = templateUrl.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileName}`;
        
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Continue even if Cloudinary delete fails
      }
    }

    // Update database - clear both fields to be safe
    await prisma.lawyerLetterhead.update({
      where: { lawyerId: userId },
      data: { 
        customLetterheadUrl: null,
        letterheadUrl: letterhead.letterheadUrl?.includes('cloudinary') ? '' : letterhead.letterheadUrl // Keep non-cloudinary letterheadUrl
      }
    });

    res.json({
      success: true,
      message: 'Letterhead template deleted successfully'
    });
  } catch (error) {
    console.error('Delete letterhead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete letterhead template'
    });
  }
};

/**
 * Update letterhead preference (system-generated vs custom)
 */
export const updateLetterheadPreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can update letterhead preference'
      });
      return;
    }

    const { useCustomLetterhead } = req.body;

    if (typeof useCustomLetterhead !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'useCustomLetterhead must be a boolean value'
      });
      return;
    }

    // Update preference
    const letterhead = await prisma.lawyerLetterhead.upsert({
      where: { lawyerId: userId },
      update: {
        useCustomLetterhead,
        updatedAt: new Date()
      },
      create: {
        lawyerId: userId,
        letterheadUrl: '', // Placeholder
        useCustomLetterhead,
        firmName: '',
        licenseNumber: '',
        certificatePrefix: 'WP'
      }
    });

    res.json({
      success: true,
      message: 'Letterhead preference updated successfully',
      data: letterhead
    });
  } catch (error) {
    console.error('Update letterhead preference error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update letterhead preference'
    });
  }
};
