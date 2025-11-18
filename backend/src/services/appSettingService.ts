import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAppSetting(key: string): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting?.value || null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getAllAppSettings(): Promise<Record<string, string>> {
  const settings = await prisma.appSetting.findMany();
  return Object.fromEntries(settings.map(s => [s.key, s.value]));
}
