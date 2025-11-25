import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs/promises';
import path from 'path';

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

    // Move file to permanent storage
    const signaturesDir = path.join(__dirname, '../../storage/lawyer-signatures');
    await fs.mkdir(signaturesDir, { recursive: true });

    const fileName = `signature-${userId}-${Date.now()}.png`;
    const filePath = path.join(signaturesDir, fileName);
    await fs.rename(file.path, filePath);

    const signatureUrl = `/uploads/lawyer-signatures/${fileName}`;

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
        signatureUrl: letterhead.signatureUrl
      }
    });
  } catch (error) {
    console.error('Upload signature error:', error);
    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
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

    // Move file to permanent storage
    const stampsDir = path.join(__dirname, '../../storage/lawyer-stamps');
    await fs.mkdir(stampsDir, { recursive: true });

    const fileName = `stamp-${userId}-${Date.now()}.png`;
    const filePath = path.join(stampsDir, fileName);
    await fs.rename(file.path, filePath);

    const stampUrl = `/uploads/lawyer-stamps/${fileName}`;

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
        stampUrl: letterhead.stampUrl
      }
    });
  } catch (error) {
    console.error('Upload stamp error:', error);
    // Clean up file if exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
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

    if (!firmName || !licenseNumber) {
      res.status(400).json({
        success: false,
        message: 'Firm name and license number are required'
      });
      return;
    }

    // Update or create letterhead
    const letterhead = await prisma.lawyerLetterhead.upsert({
      where: { lawyerId: userId },
      update: {
        firmName,
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

    // Delete file
    const filePath = path.join(__dirname, '../../storage', letterhead.signatureUrl.replace('/uploads/', ''));
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting signature file:', error);
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

    // Delete file
    const filePath = path.join(__dirname, '../../storage', letterhead.stampUrl.replace('/uploads/', ''));
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting stamp file:', error);
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
