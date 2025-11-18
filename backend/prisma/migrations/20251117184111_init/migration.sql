-- RenameForeignKey
ALTER TABLE "VideoParticipant" RENAME CONSTRAINT "VideoParticipant_userId_as_provider_fkey" TO "VideoParticipant_userId_as_video_participant_fkey";

-- RenameForeignKey
ALTER TABLE "VideoParticipant" RENAME CONSTRAINT "VideoParticipant_userId_as_video_participant_fkey" TO "VideoParticipant_userId_as_provider_fkey";
