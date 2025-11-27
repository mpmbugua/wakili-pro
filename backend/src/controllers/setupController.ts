import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Initialize admin user if not exists
 * This is a one-time setup endpoint
 */
export const initializeAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminEmail = 'admin@wakilipro.com';
    const adminPassword = 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      res.json({
        success: true,
        message: 'Admin user already exists',
        data: {
          email: existingAdmin.email,
          role: existingAdmin.role
        }
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        emailVerified: true,
        phoneNumber: '+254700000000',
        verificationStatus: 'VERIFIED'
      }
    });

    res.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        email: admin.email,
        role: admin.role,
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      }
    });
  } catch (error) {
    console.error('Initialize admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize admin user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Check if admin exists
 */
export const checkAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminEmail = 'admin@wakilipro.com';
    
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (admin) {
      res.json({
        success: true,
        message: 'Admin user exists',
        data: admin
      });
    } else {
      res.json({
        success: false,
        message: 'Admin user does not exist'
      });
    }
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check admin user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
