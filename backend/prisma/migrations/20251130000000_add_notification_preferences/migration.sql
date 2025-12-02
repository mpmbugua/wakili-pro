-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "smsNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "consultation Reminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "profileVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showActivityStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "dataAnalytics" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi';
