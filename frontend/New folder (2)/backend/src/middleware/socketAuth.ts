import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';

export const authenticateSocket = async (socket: any, next: any) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};