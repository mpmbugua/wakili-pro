-- Reset migration state and mark all as applied
-- This SQL script fixes the broken migration state

-- First, check current migration status
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;

-- Mark the failed init migration as rolled back
DELETE FROM "_prisma_migrations" WHERE migration_name = '20251113081909_init' AND finished_at IS NULL;

-- Insert all migrations as applied (if they don't exist)
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES 
  (gen_random_uuid(), '', NOW(), '20251113081909_init', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251115104318_document_marketplace', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251117152958_add_feature_event', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251123074255_update_oauth_fields', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251126000000_add_linkedin_and_tier', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251127000000_add_oauth_columns', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251127080500_remove_oauth_fields', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251128120000_add_user_documents', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251129000000_fix_document_review_source', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251130000000_add_notification_preferences', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251130135800_add_letterhead_preference', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251130135805_add_letterhead_preference', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20251130222900_add_messaging_system', NULL, NULL, NOW(), 1)
ON CONFLICT DO NOTHING;

-- Verify
SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at;
