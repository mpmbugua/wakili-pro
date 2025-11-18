// Simple notification utility for demo (replace with real email, push, or in-app notification logic)
import { User, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function sendNotificationToAllUsers(subject: string, message: string) {
  // Fetch all users (filter by role if needed)
  const users: User[] = await prisma.user.findMany();
  for (const user of users) {
    // Replace this with your real notification logic (email, push, etc.)
    console.log(`[NOTIFY] To: ${user.email || user.id} | Subject: ${subject} | Message: ${message}`);
    // Optionally, store notification in DB for in-app display
    // await prisma.notification.create({ data: { userId: user.id, subject, message, type: 'INFO' } });
  }
}
