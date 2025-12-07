-- Seed lawyer profiles directly via SQL

-- Lucy Wanjiku
INSERT INTO "LawyerProfile" (
  "id", "providerId", "userId", "licenseNumber", "yearOfAdmission", "specializations", 
  "location", "bio", "yearsOfExperience", "isVerified", "tier", "rating", "reviewCount",
  "status", "linkedInProfile", "phoneNumber"
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id,
  'LSK-2015-001',
  2015,
  ARRAY['Corporate Law', 'Commercial Law', 'Data Protection'],
  '{"city":"Nairobi","county":"Nairobi"}',
  'Experienced corporate lawyer specializing in data protection and commercial law with over 8 years of practice.',
  8,
  true,
  'PRO',
  4.9,
  147,
  'ACTIVE',
  'https://linkedin.com/in/lucy-wanjiku',
  u."phoneNumber"
FROM "User" u
WHERE u.email = 'lucy@wakilipro.com'
AND NOT EXISTS (SELECT 1 FROM "LawyerProfile" WHERE "providerId" = u.id);

-- James Mwangi  
INSERT INTO "LawyerProfile" (
  "id", "providerId", "userId", "licenseNumber", "yearOfAdmission", "specializations",
  "location", "bio", "yearsOfExperience", "isVerified", "tier", "rating", "reviewCount",
  "status", "linkedInProfile", "phoneNumber"
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id,
  'LSK-2017-002',
  2017,
  ARRAY['Employment Law', 'Labor Law', 'HR Compliance'],
  '{"city":"Mombasa","county":"Mombasa"}',
  'Employment law specialist helping businesses navigate labor regulations and workplace disputes.',
  6,
  true,
  'LITE',
  4.8,
  112,
  'ACTIVE',
  'https://linkedin.com/in/james-mwangi',
  u."phoneNumber"
FROM "User" u
WHERE u.email = 'james@wakilipro.com'
AND NOT EXISTS (SELECT 1 FROM "LawyerProfile" WHERE "providerId" = u.id);

-- Grace Njeri
INSERT INTO "LawyerProfile" (
  "id", "providerId", "userId", "licenseNumber", "yearOfAdmission", "specializations",
  "location", "bio", "yearsOfExperience", "isVerified", "tier", "rating", "reviewCount",
  "status", "linkedInProfile", "phoneNumber"
)
SELECT
  gen_random_uuid(),
  u.id,
  u.id,
  'LSK-2016-003',
  2016,
  ARRAY['Property Law', 'Real Estate', 'Land Law'],
  '{"city":"Nairobi","county":"Nairobi"}',
  'Property law expert with extensive experience in real estate transactions and land disputes.',
  7,
  true,
  'PRO',
  4.7,
  128,
  'ACTIVE',
  'https://linkedin.com/in/grace-njeri',
  u."phoneNumber"
FROM "User" u
WHERE u.email = 'grace@wakilipro.com'
AND NOT EXISTS (SELECT 1 FROM "LawyerProfile" WHERE "providerId" = u.id);

-- Verify
SELECT 
  u."firstName", 
  u."lastName", 
  lp."licenseNumber",
  lp."isVerified",
  lp."tier",
  lp."rating"
FROM "LawyerProfile" lp
JOIN "User" u ON lp."providerId" = u.id
WHERE u.email IN ('lucy@wakilipro.com', 'james@wakilipro.com', 'grace@wakilipro.com');
