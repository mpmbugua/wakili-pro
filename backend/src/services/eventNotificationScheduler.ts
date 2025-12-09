import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
// import your notification sending utility here
import { sendNotificationToAllUsers } from './notificationService';

const prisma = new PrismaClient();

async function sendImmediateNotifications() {
  // TODO: Re-enable when notification tracking fields added to LegalEvent schema
  // const events = await prisma.legalEvent.findMany({ where: { notifiedImmediate: false } });
  const events = await prisma.legalEvent.findMany({ take: 10 });
  for (const event of events) {
    await sendNotificationToAllUsers(
      `New Legal Event: ${event.title}`,
      `Date: ${event.eventDate.toLocaleString()}\nSource: ${event.sourceUrl}\n${event.sourceUrl}`
    );
    // await prisma.legalEvent.update({ where: { id: event.id }, data: { notifiedImmediate: true } });
  }
}

async function send24hReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  // TODO: Re-enable when notification tracking fields added
  // const events = await prisma.legalEvent.findMany({
  //   where: {
  //     notifiedImmediate: true,
  //     notified24h: false,
  //     eventDate: { gte: in24h, lte: new Date(in24h.getTime() + 60 * 60 * 1000) },
  //   },
  // });
  const events = await prisma.legalEvent.findMany({
    where: {
      eventDate: { gte: in24h, lte: new Date(in24h.getTime() + 60 * 60 * 1000) },
    },
  });
  for (const event of events) {
    await sendNotificationToAllUsers(
      `Reminder: ${event.title} is in 24 hours!`,
      `Date: ${event.eventDate.toLocaleString()}\nSource: ${event.sourceUrl}\n${event.sourceUrl}`
    );
    // await prisma.legalEvent.update({ where: { id: event.id }, data: { notified24h: true } });
  }
}

async function send30minReminders() {
  const now = new Date();
  const in30min = new Date(now.getTime() + 30 * 60 * 1000);
  // TODO: Re-enable when notification tracking fields added
  // const events = await prisma.legalEvent.findMany({
  //   where: {
  //     notified24h: true,
  //     notified30min: false,
  //     eventDate: { gte: in30min, lte: new Date(in30min.getTime() + 10 * 60 * 1000) },
  //   },
  // });
  const events = await prisma.legalEvent.findMany({
    where: {
      eventDate: { gte: in30min, lte: new Date(in30min.getTime() + 10 * 60 * 1000) },
    },
  });
  for (const event of events) {
    await sendNotificationToAllUsers(
      `Final Reminder: ${event.title} starts in 30 minutes!`,
      `Date: ${event.eventDate.toLocaleString()}\nSource: ${event.sourceUrl}\n${event.sourceUrl}`
    );
    // await prisma.legalEvent.update({ where: { id: event.id }, data: { notified30min: true } });
  }
}

// Schedule every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  await sendImmediateNotifications();
  await send24hReminders();
  await send30minReminders();
});
