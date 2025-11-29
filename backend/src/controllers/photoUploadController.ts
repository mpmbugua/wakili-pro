import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadProfilePhoto, isValidImageType } from '../services/fileUploadService';

const prisma = new PrismaClient();

export const uploadPhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No photo file provided'
      });
      return;
    }

    // Validate image type
    if (!isValidImageType(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed'
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadProfilePhoto(
      req.file.buffer,
      req.file.originalname,
      userId
    );

    // Update user profile with Cloudinary URL
    await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: uploadResult.url }
    });

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        fileSize: uploadResult.fileSize
      }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo'
    });
  }
};
