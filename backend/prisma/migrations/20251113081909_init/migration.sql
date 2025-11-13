-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PUBLIC', 'LAWYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CONSULTATION', 'DOCUMENT_DRAFTING', 'LEGAL_REVIEW', 'IP_FILING', 'DISPUTE_MEDIATION', 'CONTRACT_NEGOTIATION');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('CIVIL', 'CRIMINAL', 'FAMILY', 'CORPORATE', 'PROPERTY', 'EMPLOYMENT', 'CONSTITUTIONAL');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('ACTIVE', 'PENDING', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CLEActivityType" AS ENUM ('SEMINAR', 'CONFERENCE', 'ONLINE_COURSE', 'WRITING', 'TEACHING', 'PRO_BONO');

-- CreateEnum
CREATE TYPE "CLEStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AIQueryType" AS ENUM ('VOICE', 'TEXT');

-- CreateEnum
CREATE TYPE "AIContext" AS ENUM ('LEGAL_ADVICE', 'DOCUMENT_GENERATION', 'LEGAL_RESEARCH', 'CASE_ANALYSIS');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('LEGISLATION', 'COURT_DECISIONS', 'LEGAL_PRACTICE', 'REGULATORY_UPDATES', 'INDUSTRY_NEWS', 'INTERNATIONAL_LAW');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MPESA', 'STRIPE_CARD', 'BANK_TRANSFER', 'WALLET');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'PAYOUT', 'FEE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VideoConsultationStatus" AS ENUM ('SCHEDULED', 'WAITING_FOR_PARTICIPANTS', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('LAWYER', 'CLIENT', 'OBSERVER');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING', 'FAILED');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'FILE', 'IMAGE', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'MESSAGE_RECEIVED', 'SERVICE_REVIEW', 'SYSTEM_ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "county" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lawyer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "yearOfAdmission" INTEGER NOT NULL,
    "specializations" JSONB NOT NULL,
    "location" JSONB NOT NULL,
    "bio" TEXT NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileImageUrl" TEXT,
    "availability" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "priceKES" INTEGER NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_services" (
    "id" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "priceKES" INTEGER NOT NULL,
    "duration" INTEGER,
    "deliveryTimeframe" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_bookings" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmountKES" INTEGER NOT NULL,
    "clientRequirements" TEXT NOT NULL,
    "providerNotes" TEXT,
    "deliverables" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "externalTransactionId" TEXT,
    "metadata" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "releaseDate" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "platformFee" DOUBLE PRECISION,
    "lawyerPayout" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "externalRefundId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_consultations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "VideoConsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "roomId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "meetingNotes" TEXT,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER NOT NULL DEFAULT 2,
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingStartedAt" TIMESTAMP(3),
    "recordingEndedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_participants" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participantType" "ParticipantType" NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "connectionStatus" "ConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "hasVideo" BOOLEAN NOT NULL DEFAULT true,
    "hasAudio" BOOLEAN NOT NULL DEFAULT true,
    "isScreenSharing" BOOLEAN NOT NULL DEFAULT false,
    "peerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_recordings" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "duration" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "codec" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processingStatus" TEXT,
    "thumbnailKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_registrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "status" "ChatStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_reviews" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "caseNumber" TEXT,
    "court" TEXT,
    "caseType" "CaseType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "dateOpened" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateClosed" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_documents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_events" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_entries" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cle_records" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "activityType" "CLEActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "hoursEarned" DOUBLE PRECISION NOT NULL,
    "dateCompleted" TIMESTAMP(3) NOT NULL,
    "certificateUrl" TEXT,
    "status" "CLEStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cle_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "type" "AIQueryType" NOT NULL,
    "context" "AIContext" NOT NULL,
    "response" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "tags" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "externalUrl" TEXT,
    "isBreaking" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_news_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_profiles_userId_key" ON "lawyer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lawyer_profiles_licenseNumber_key" ON "lawyer_profiles"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_paymentId_key" ON "escrow_transactions"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "video_consultations_bookingId_key" ON "video_consultations"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "video_consultations_roomId_key" ON "video_consultations"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "video_participants_consultationId_userId_key" ON "video_participants"("consultationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "device_registrations_deviceToken_key" ON "device_registrations"("deviceToken");

-- CreateIndex
CREATE UNIQUE INDEX "chat_rooms_bookingId_key" ON "chat_rooms"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "service_reviews_serviceId_authorId_key" ON "service_reviews"("serviceId", "authorId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyer_profiles" ADD CONSTRAINT "lawyer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_services" ADD CONSTRAINT "marketplace_services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "marketplace_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_consultations" ADD CONSTRAINT "video_consultations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_consultations" ADD CONSTRAINT "video_consultations_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_consultations" ADD CONSTRAINT "video_consultations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_participants" ADD CONSTRAINT "video_participants_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "video_consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_participants" ADD CONSTRAINT "video_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_recordings" ADD CONSTRAINT "consultation_recordings_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "video_consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_registrations" ADD CONSTRAINT "device_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "service_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "marketplace_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_entries" ADD CONSTRAINT "billing_entries_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cle_records" ADD CONSTRAINT "cle_records_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "lawyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
