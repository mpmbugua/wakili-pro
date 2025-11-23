/*
  Warnings:

  - The values [INFO,SUCCESS,WARNING,ERROR] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMPLETED,CANCELLED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [FAILED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `AppSetting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `AppSetting` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `AppSetting` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AppSetting` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `ChatMessage` table. All the data in the column will be lost.
  - The `messageType` column on the `ChatMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `name` on the `ChatRoom` table. All the data in the column will be lost.
  - The `status` column on the `ChatRoom` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `clientId` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `lawyerId` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `recordingEndedAt` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `recordingStartedAt` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `storageKey` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `ConsultationRecording` table. All the data in the column will be lost.
  - You are about to drop the column `appVersion` on the `DeviceRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `deviceToken` on the `DeviceRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `DeviceRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeen` on the `DeviceRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `DeviceRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `DocumentPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `DocumentPurchase` table. All the data in the column will be lost.
  - The `status` column on the `DocumentPurchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `consultationId` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `priceKES` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `recordingStartedAt` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `storageKey` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `LawyerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `LawyerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profileImageUrl` on the `LawyerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `LawyerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `yearsOfExperience` on the `LawyerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryTimeframe` on the `MarketplaceService` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `MarketplaceService` table. All the data in the column will be lost.
  - You are about to drop the column `externalTransactionId` on the `MarketplaceService` table. All the data in the column will be lost.
  - The `status` column on the `MarketplaceService` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `appVersion` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeen` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `priceKES` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `releasedAt` on the `Refund` table. All the data in the column will be lost.
  - You are about to drop the column `clientRequirements` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `lawyerId` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `providerNotes` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmountKES` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `profileImageUrl` on the `User` table. All the data in the column will be lost.
  - The `verificationStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `amount` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `VideoConsultation` table. All the data in the column will be lost.
  - You are about to drop the column `connectionStatus` on the `VideoParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `hasAudio` on the `VideoParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `hasVideo` on the `VideoParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `VideoParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `participantType` on the `VideoParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `bookingId` on the `WalletTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `WalletTransaction` table. All the data in the column will be lost.
  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Badge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EscrowTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Favorite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeatureEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LawyerSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoyaltyPoint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseLimit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Referral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LawyerProfileUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paymentId]` on the table `DocumentPurchase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facebookId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingId]` on the table `VideoConsultation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `confidence` to the `AIQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelUsed` to the `AIQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `queryType` to the `AIQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `response` to the `AIQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokensUsed` to the `AIQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `ChatMessage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastActivity` on table `ChatRoom` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `startedAt` to the `ConsultationRecording` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ConsultationRecording` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `DeviceRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateId` to the `DocumentPurchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `DocumentTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `DocumentTemplate` table without a default value. This is not possible if the table is not empty.
  - Made the column `isActive` on table `DocumentTemplate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tier` on table `LawyerProfile` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `type` on the `MarketplaceService` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `message` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `method` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Refund` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `clientId` on table `ServiceBooking` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `ServiceBooking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `scheduledAt` on table `VideoConsultation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isRecorded` on table `VideoConsultation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bookingId` on table `VideoConsultation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clientId` on table `VideoConsultation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lawyerId` on table `VideoConsultation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `participantCount` on table `VideoConsultation` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `type` on the `WalletTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `WalletTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PUBLIC', 'LAWYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('ENTRY', 'STANDARD', 'PREMIUM', 'ELITE');

-- CreateEnum
CREATE TYPE "DocumentTier" AS ENUM ('BASIC', 'FILLED', 'CERTIFIED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'FILLED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'CONSULTATION_REQUIRED', 'CONSULTATION_SCHEDULED', 'REVISION_NEEDED', 'CERTIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ServiceTypeEnum" AS ENUM ('VIDEO_CONSULTATION', 'MARKETPLACE_SERVICE', 'DOCUMENT_CERTIFICATION');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'PAYOUT', 'FEE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'FILE', 'IMAGE', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('CONSTITUTION', 'ACT', 'REGULATION', 'CASE_LAW', 'PROCEDURE', 'FORM', 'GUIDELINE', 'TREATY');

-- AlterEnum
ALTER TYPE "LawyerTier" ADD VALUE 'FREE';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'MESSAGE_RECEIVED', 'SERVICE_REVIEW', 'SYSTEM_ANNOUNCEMENT', 'CERTIFICATION_AVAILABLE', 'CERTIFICATION_COMPLETED', 'CERTIFICATION_REJECTED', 'REVISION_REQUESTED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_COMPLETED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'PENDING');
ALTER TABLE "LawyerSubscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AIQuery" DROP CONSTRAINT "AIQuery_userId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_authorId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_roomId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationRecording" DROP CONSTRAINT "ConsultationRecording_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationRecording" DROP CONSTRAINT "ConsultationRecording_consultationId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationRecording" DROP CONSTRAINT "ConsultationRecording_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceRegistration" DROP CONSTRAINT "DeviceRegistration_userId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentPurchase" DROP CONSTRAINT "DocumentPurchase_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentPurchase" DROP CONSTRAINT "DocumentPurchase_documentId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentVersion" DROP CONSTRAINT "DocumentVersion_documentId_fkey";

-- DropForeignKey
ALTER TABLE "EscrowTransaction" DROP CONSTRAINT "EscrowTransaction_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_fkey";

-- DropForeignKey
ALTER TABLE "FeatureEvent" DROP CONSTRAINT "FeatureEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "LawyerProfile" DROP CONSTRAINT "LawyerProfile_providerId_fkey";

-- DropForeignKey
ALTER TABLE "LawyerSubscription" DROP CONSTRAINT "LawyerSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyPoint" DROP CONSTRAINT "LoyaltyPoint_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_documentId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseLimit" DROP CONSTRAINT "PurchaseLimit_templateId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseLimit" DROP CONSTRAINT "PurchaseLimit_userId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_refereeId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrerId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceBooking" DROP CONSTRAINT "ServiceBooking_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceBooking" DROP CONSTRAINT "ServiceBooking_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceBooking" DROP CONSTRAINT "ServiceBooking_lawyerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceBooking" DROP CONSTRAINT "ServiceBooking_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceReview" DROP CONSTRAINT "ServiceReview_lawyerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "VideoConsultation" DROP CONSTRAINT "VideoConsultation_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "VideoConsultation" DROP CONSTRAINT "VideoConsultation_clientId_fkey";

-- DropForeignKey
ALTER TABLE "VideoConsultation" DROP CONSTRAINT "VideoConsultation_documentId_fkey";

-- DropForeignKey
ALTER TABLE "VideoConsultation" DROP CONSTRAINT "VideoConsultation_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "VideoConsultation" DROP CONSTRAINT "VideoConsultation_providerId_fkey";

-- DropForeignKey
ALTER TABLE "VideoConsultation" DROP CONSTRAINT "VideoConsultation_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "_LawyerProfileUser" DROP CONSTRAINT "_LawyerProfileUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_LawyerProfileUser" DROP CONSTRAINT "_LawyerProfileUser_B_fkey";

-- DropIndex
DROP INDEX "AppSetting_key_key";

-- DropIndex
DROP INDEX "LawyerProfile_licenseNumber_key";

-- DropIndex
DROP INDEX "LawyerProfile_providerId_key";

-- DropIndex
DROP INDEX "RefreshToken_token_key";

-- AlterTable
ALTER TABLE "AIQuery" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "context" TEXT,
ADD COLUMN     "modelUsed" TEXT NOT NULL,
ADD COLUMN     "queryType" TEXT NOT NULL,
ADD COLUMN     "response" TEXT NOT NULL,
ADD COLUMN     "retrievedDocs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sources" JSONB,
ADD COLUMN     "tokensUsed" INTEGER NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AppSetting" DROP CONSTRAINT "AppSetting_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ADD CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key");

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "clientId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "messageType",
ADD COLUMN     "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "content" SET NOT NULL;

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "name",
DROP COLUMN "status",
ADD COLUMN     "status" "ChatStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "lastActivity" SET NOT NULL;

-- AlterTable
ALTER TABLE "ConsultationRecording" DROP COLUMN "clientId",
DROP COLUMN "duration",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "format",
DROP COLUMN "lawyerId",
DROP COLUMN "recordingEndedAt",
DROP COLUMN "recordingStartedAt",
DROP COLUMN "storageKey",
DROP COLUMN "uploadedAt",
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "DeviceRegistration" DROP COLUMN "appVersion",
DROP COLUMN "deviceToken",
DROP COLUMN "isActive",
DROP COLUMN "lastSeen",
DROP COLUMN "platform",
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DocumentPurchase" DROP COLUMN "amount",
DROP COLUMN "bookingId",
DROP COLUMN "content",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "documentId",
DROP COLUMN "referenceId",
DROP COLUMN "template",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
ADD COLUMN     "certificationFee" INTEGER,
ADD COLUMN     "certifiedAt" TIMESTAMP(3),
ADD COLUMN     "certifiedBy" TEXT,
ADD COLUMN     "certifiedDocUrl" TEXT,
ADD COLUMN     "clientFeedback" TEXT,
ADD COLUMN     "clientRating" INTEGER,
ADD COLUMN     "consultationBookingId" TEXT,
ADD COLUMN     "consultationNotes" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "filledData" JSONB,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "requiresCertification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresConsultation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewTimeHours" DOUBLE PRECISION,
ADD COLUMN     "templateId" TEXT NOT NULL,
ADD COLUMN     "tier" "DocumentTier" NOT NULL DEFAULT 'BASIC',
DROP COLUMN "status",
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "DocumentTemplate" DROP COLUMN "consultationId",
DROP COLUMN "duration",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "format",
DROP COLUMN "isPublic",
DROP COLUMN "priceKES",
DROP COLUMN "recordingStartedAt",
DROP COLUMN "storageKey",
DROP COLUMN "template",
DROP COLUMN "type",
DROP COLUMN "uploadedAt",
DROP COLUMN "url",
ADD COLUMN     "basePrice" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "complexity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'PLATFORM',
ADD COLUMN     "formFields" JSONB,
ADD COLUMN     "smartFillPrice" INTEGER NOT NULL DEFAULT 1000,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "isActive" SET NOT NULL;

-- AlterTable
ALTER TABLE "LawyerProfile" DROP COLUMN "availability",
DROP COLUMN "bio",
DROP COLUMN "profileImageUrl",
DROP COLUMN "providerId",
DROP COLUMN "yearsOfExperience",
ADD COLUMN     "acceptingCertifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "avgCertificationTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "certificationCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "certificationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consultationRate" INTEGER,
ADD COLUMN     "firmAddress" TEXT,
ADD COLUMN     "firmLetterhead" TEXT,
ADD COLUMN     "firmName" TEXT,
ADD COLUMN     "lskFirmNumber" TEXT,
ADD COLUMN     "maxBookingsPerMonth" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "maxCertificationsPerDay" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maxCertificationsPerMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxServicesPerMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxSpecializations" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "monthlyBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyCertifications" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyServices" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricingTier" "PricingTier" NOT NULL DEFAULT 'ENTRY',
ADD COLUMN     "usageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "tier" SET NOT NULL,
ALTER COLUMN "tier" SET DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "MarketplaceService" DROP COLUMN "deliveryTimeframe",
DROP COLUMN "duration",
DROP COLUMN "externalTransactionId",
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "isWakiliVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "type",
ADD COLUMN     "type" "ServiceType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "createdAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "message" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "appVersion",
DROP COLUMN "documentId",
DROP COLUMN "lastSeen",
DROP COLUMN "metadata",
DROP COLUMN "priceKES",
DROP COLUMN "provider",
DROP COLUMN "targetId",
DROP COLUMN "transactionId",
DROP COLUMN "type",
DROP COLUMN "verifiedAt",
ADD COLUMN     "grossAmount" INTEGER,
ADD COLUMN     "lawyerNetPayout" INTEGER,
ADD COLUMN     "lawyerShareBeforeWHT" INTEGER,
ADD COLUMN     "platformCommission" INTEGER,
ADD COLUMN     "serviceType" "ServiceTypeEnum",
ADD COLUMN     "whtAmount" INTEGER,
ADD COLUMN     "whtCertificateIssued" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whtRemittanceDate" TIMESTAMP(3),
ADD COLUMN     "whtRemittedToKRA" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "bookingId" DROP NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "method" SET NOT NULL;

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "expiresAt";

-- AlterTable
ALTER TABLE "Refund" DROP COLUMN "releasedAt",
DROP COLUMN "status",
ADD COLUMN     "status" "RefundStatus" NOT NULL;

-- AlterTable
ALTER TABLE "ServiceBooking" DROP COLUMN "clientRequirements",
DROP COLUMN "lawyerId",
DROP COLUMN "paymentStatus",
DROP COLUMN "providerNotes",
DROP COLUMN "totalAmountKES",
DROP COLUMN "userId",
ALTER COLUMN "clientId" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImageUrl",
ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "provider" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL,
DROP COLUMN "verificationStatus",
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT;

-- AlterTable
ALTER TABLE "VideoConsultation" DROP COLUMN "amount",
DROP COLUMN "description",
DROP COLUMN "documentId",
DROP COLUMN "duration",
DROP COLUMN "providerId",
DROP COLUMN "referenceId",
DROP COLUMN "startedAt",
DROP COLUMN "type",
DROP COLUMN "userId",
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED',
ALTER COLUMN "scheduledAt" SET NOT NULL,
ALTER COLUMN "isRecorded" SET NOT NULL,
ALTER COLUMN "bookingId" SET NOT NULL,
ALTER COLUMN "clientId" SET NOT NULL,
ALTER COLUMN "lawyerId" SET NOT NULL,
ALTER COLUMN "participantCount" SET NOT NULL,
ALTER COLUMN "participantCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "VideoParticipant" DROP COLUMN "connectionStatus",
DROP COLUMN "hasAudio",
DROP COLUMN "hasVideo",
DROP COLUMN "isActive",
DROP COLUMN "participantType";

-- AlterTable
ALTER TABLE "WalletTransaction" DROP COLUMN "bookingId",
DROP COLUMN "referenceId",
DROP COLUMN "type",
ADD COLUMN     "type" "WalletTransactionType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL;

-- DropTable
DROP TABLE "Article";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Badge";

-- DropTable
DROP TABLE "DocumentVersion";

-- DropTable
DROP TABLE "EscrowTransaction";

-- DropTable
DROP TABLE "Favorite";

-- DropTable
DROP TABLE "FeatureEvent";

-- DropTable
DROP TABLE "LawyerSubscription";

-- DropTable
DROP TABLE "LoyaltyPoint";

-- DropTable
DROP TABLE "PurchaseLimit";

-- DropTable
DROP TABLE "Referral";

-- DropTable
DROP TABLE "_LawyerProfileUser";

-- DropEnum
DROP TYPE "MarketplaceServiceStatus";

-- DropEnum
DROP TYPE "MarketplaceServiceType";

-- DropEnum
DROP TYPE "PaymentType";

-- DropEnum
DROP TYPE "ServiceBookingStatus";

-- DropEnum
DROP TYPE "SubscriptionPlan";

-- DropEnum
DROP TYPE "VideoConsultationType";

-- CreateTable
CREATE TABLE "LegalEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "notifiedImmediate" BOOLEAN NOT NULL DEFAULT false,
    "notified24h" BOOLEAN NOT NULL DEFAULT false,
    "notified30min" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'KENYA',
    "category" TEXT NOT NULL,
    "citation" TEXT,
    "sourceUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentEmbedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "vectorId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "tier" "LawyerTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "monthlyFee" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'MPESA',
    "lastPaymentId" TEXT,
    "nextBillingDate" TIMESTAMP(3),
    "upgradesFrom" "LawyerTier",
    "downgradesFrom" "LawyerTier",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyWHTReport" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalWHTCollected" INTEGER NOT NULL,
    "totalPayments" INTEGER NOT NULL,
    "paymentIds" TEXT[],
    "remittedToKRA" BOOLEAN NOT NULL DEFAULT false,
    "remittanceDate" TIMESTAMP(3),
    "kraReceiptNumber" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,

    CONSTRAINT "MonthlyWHTReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalDocument_documentType_idx" ON "LegalDocument"("documentType");

-- CreateIndex
CREATE INDEX "LegalDocument_category_idx" ON "LegalDocument"("category");

-- CreateIndex
CREATE INDEX "LegalDocument_jurisdiction_idx" ON "LegalDocument"("jurisdiction");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentEmbedding_vectorId_key" ON "DocumentEmbedding"("vectorId");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_documentId_idx" ON "DocumentEmbedding"("documentId");

-- CreateIndex
CREATE INDEX "DocumentEmbedding_vectorId_idx" ON "DocumentEmbedding"("vectorId");

-- CreateIndex
CREATE INDEX "ConversationHistory_userId_idx" ON "ConversationHistory"("userId");

-- CreateIndex
CREATE INDEX "ConversationHistory_sessionId_idx" ON "ConversationHistory"("sessionId");

-- CreateIndex
CREATE INDEX "ConversationHistory_lastActivity_idx" ON "ConversationHistory"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationHistory_userId_sessionId_key" ON "ConversationHistory"("userId", "sessionId");

-- CreateIndex
CREATE INDEX "Subscription_lawyerId_idx" ON "Subscription"("lawyerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyWHTReport_month_year_key" ON "MonthlyWHTReport"("month", "year");

-- CreateIndex
CREATE INDEX "AIQuery_userId_idx" ON "AIQuery"("userId");

-- CreateIndex
CREATE INDEX "AIQuery_createdAt_idx" ON "AIQuery"("createdAt");

-- CreateIndex
CREATE INDEX "AIQuery_queryType_idx" ON "AIQuery"("queryType");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPurchase_paymentId_key" ON "DocumentPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "DocumentPurchase_userId_idx" ON "DocumentPurchase"("userId");

-- CreateIndex
CREATE INDEX "DocumentPurchase_status_idx" ON "DocumentPurchase"("status");

-- CreateIndex
CREATE INDEX "DocumentPurchase_certifiedBy_idx" ON "DocumentPurchase"("certifiedBy");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_facebookId_key" ON "User"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoConsultation_bookingId_key" ON "VideoConsultation"("bookingId");

-- RenameForeignKey
ALTER TABLE "VideoParticipant" RENAME CONSTRAINT "VideoParticipant_userId_as_participant_fkey" TO "VideoParticipant_userId_fkey";

-- AddForeignKey
ALTER TABLE "DocumentPurchase" ADD CONSTRAINT "DocumentPurchase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPurchase" ADD CONSTRAINT "DocumentPurchase_certifiedBy_fkey" FOREIGN KEY ("certifiedBy") REFERENCES "LawyerProfile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPurchase" ADD CONSTRAINT "DocumentPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ServiceBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoConsultation" ADD CONSTRAINT "VideoConsultation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ServiceBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoConsultation" ADD CONSTRAINT "VideoConsultation_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoConsultation" ADD CONSTRAINT "VideoConsultation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIQuery" ADD CONSTRAINT "AIQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentEmbedding" ADD CONSTRAINT "DocumentEmbedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationHistory" ADD CONSTRAINT "ConversationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "LawyerProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
