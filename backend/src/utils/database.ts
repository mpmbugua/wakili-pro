
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Create Prisma client with fallback
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty'
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL environment variable is not set');
      return false;
    }
    
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});