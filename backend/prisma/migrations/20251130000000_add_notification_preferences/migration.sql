-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "smsNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "consultationReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "profileVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showActivityStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "dataAnalytics" BOOLEAN NOT NULL DEFAULT true;
