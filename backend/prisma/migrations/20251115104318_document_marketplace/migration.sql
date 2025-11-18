/*
  Warnings:

  - You are about to drop the `ai_queries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `billing_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_rooms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cle_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consultation_recordings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `escrow_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lawyer_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `legal_news` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `marketplace_services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refunds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_consultations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallet_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'GENERATED', 'DELIVERED', 'FAILED');

-- DropForeignKey
ALTER TABLE "ai_queries" DROP CONSTRAINT "ai_queries_userId_fkey";

-- DropForeignKey
ALTER TABLE "billing_entries" DROP CONSTRAINT "billing_entries_caseId_fkey";

-- DropForeignKey
ALTER TABLE "case_documents" DROP CONSTRAINT "case_documents_caseId_fkey";

-- DropForeignKey
ALTER TABLE "case_events" DROP CONSTRAINT "case_events_caseId_fkey";

-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_roomId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_clientId_fkey";

-- DropForeignKey
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "cle_records" DROP CONSTRAINT "cle_records_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "consultation_recordings" DROP CONSTRAINT "consultation_recordings_consultationId_fkey";

-- DropForeignKey
ALTER TABLE "device_registrations" DROP CONSTRAINT "device_registrations_userId_fkey";

-- DropForeignKey
ALTER TABLE "escrow_transactions" DROP CONSTRAINT "escrow_transactions_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "lawyer_profiles" DROP CONSTRAINT "lawyer_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "marketplace_services" DROP CONSTRAINT "marketplace_services_providerId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_requestedBy_fkey";

-- DropForeignKey
ALTER TABLE "service_bookings" DROP CONSTRAINT "service_bookings_clientId_fkey";

-- DropForeignKey
ALTER TABLE "service_bookings" DROP CONSTRAINT "service_bookings_providerId_fkey";

-- DropForeignKey
ALTER TABLE "service_bookings" DROP CONSTRAINT "service_bookings_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "service_reviews" DROP CONSTRAINT "service_reviews_authorId_fkey";

-- DropForeignKey
ALTER TABLE "service_reviews" DROP CONSTRAINT "service_reviews_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "service_reviews" DROP CONSTRAINT "service_reviews_targetId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "video_consultations" DROP CONSTRAINT "video_consultations_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "video_consultations" DROP CONSTRAINT "video_consultations_clientId_fkey";

-- DropForeignKey
ALTER TABLE "video_consultations" DROP CONSTRAINT "video_consultations_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "video_participants" DROP CONSTRAINT "video_participants_consultationId_fkey";

-- DropForeignKey
ALTER TABLE "video_participants" DROP CONSTRAINT "video_participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_userId_fkey";

-- DropTable
DROP TABLE "ai_queries";

-- DropTable
DROP TABLE "billing_entries";

-- DropTable
DROP TABLE "case_documents";

-- DropTable
DROP TABLE "case_events";

-- DropTable
DROP TABLE "cases";

-- DropTable
DROP TABLE "chat_messages";

-- DropTable
DROP TABLE "chat_rooms";

-- DropTable
DROP TABLE "cle_records";

-- DropTable
DROP TABLE "consultation_recordings";

-- DropTable
DROP TABLE "device_registrations";

-- DropTable
DROP TABLE "escrow_transactions";

-- DropTable
DROP TABLE "lawyer_profiles";

-- DropTable
DROP TABLE "legal_news";

-- DropTable
DROP TABLE "marketplace_services";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "refunds";

-- DropTable
DROP TABLE "service_bookings";

-- DropTable
DROP TABLE "service_reviews";

-- DropTable
DROP TABLE "subscriptions";

-- DropTable
DROP TABLE "user_profiles";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "video_consultations";

-- DropTable
DROP TABLE "video_participants";

-- DropTable
DROP TABLE "wallet_transactions";

-- DropEnum
DROP TYPE "AIContext";

-- DropEnum
DROP TYPE "AIQueryType";

-- DropEnum
DROP TYPE "BillingCycle";

-- DropEnum
DROP TYPE "BookingStatus";

-- DropEnum
DROP TYPE "CLEActivityType";

-- DropEnum
DROP TYPE "CLEStatus";

-- DropEnum
DROP TYPE "CaseStatus";

-- DropEnum
DROP TYPE "CaseType";

-- DropEnum
DROP TYPE "ChatStatus";

-- DropEnum
DROP TYPE "ConnectionStatus";

-- DropEnum
DROP TYPE "EscrowStatus";

-- DropEnum
DROP TYPE "MessageType";

-- DropEnum
DROP TYPE "NewsCategory";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "ParticipantType";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "RefundStatus";

-- DropEnum
DROP TYPE "ServiceStatus";

-- DropEnum
DROP TYPE "ServiceType";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "SubscriptionTier";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "VerificationStatus";

-- DropEnum
DROP TYPE "VideoConsultationStatus";

-- DropEnum
DROP TYPE "WalletTransactionType";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "priceKES" INTEGER NOT NULL,
    "aiPromptConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "aiInput" JSONB NOT NULL,
    "aiOutputUrl" TEXT,
    "status" "DocumentPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "priceKES" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_type_title_key" ON "document_templates"("type", "title");

-- AddForeignKey
ALTER TABLE "document_purchases" ADD CONSTRAINT "document_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_purchases" ADD CONSTRAINT "document_purchases_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
