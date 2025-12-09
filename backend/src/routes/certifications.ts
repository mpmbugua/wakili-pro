import express from 'express';

const router = express.Router();

/**
 * CERTIFICATION WORKFLOW ROUTES TEMPORARILY DISABLED
 * 
 * These routes depend on certificationWorkflowService and documentAllocationService
 * which have 45 TypeScript errors due to schema mismatches.
 * 
 * The following fields are missing from the production schema:
 * - template (DocumentReview)
 * - certifiedBy, certifiedAt (DocumentReview)
 * - purchasedAt, documentUrl (DocumentPurchase)
 * - consultationNotes, requiresConsultation (VideoConsultation)
 * - avgCertificationTimeHours, monthlyCertifications, maxCertificationsPerMonth (LawyerProfile)
 * - clientRating, certificationFee, acceptingCertifications (LawyerProfile)
 * 
 * To re-enable these features:
 * 1. Update Prisma schema to include missing fields
 * 2. Run migrations
 * 3. Rename .disabled files back to .ts:
 *    - certificationWorkflowService.ts.disabled → certificationWorkflowService.ts
 *    - documentAllocationService.ts.disabled → documentAllocationService.ts
 * 4. Restore original routes from git history
 */

// Placeholder endpoints to indicate feature is disabled
router.get('/queue', (req, res) => {
  res.status(501).json({
    error: 'Certification workflow temporarily disabled',
    message: 'This feature requires schema updates. Contact support for details.'
  });
});

router.post('/:id/accept', (req, res) => {
  res.status(501).json({
    error: 'Certification workflow temporarily disabled',
    message: 'This feature requires schema updates. Contact support for details.'
  });
});

router.post('/:id/approve', (req, res) => {
  res.status(501).json({
    error: 'Certification workflow temporarily disabled',
    message: 'This feature requires schema updates. Contact support for details.'
  });
});

router.post('/:id/reject', (req, res) => {
  res.status(501).json({
    error: 'Certification workflow temporarily disabled',
    message: 'This feature requires schema updates. Contact support for details.'
  });
});

router.get('/stats', (req, res) => {
  res.status(501).json({
    error: 'Certification workflow temporarily disabled',
    message: 'This feature requires schema updates. Contact support for details.'
  });
});

router.get('/my-certifications', (req, res) => {
  res.status(501).json({
    error: 'Certification workflow temporarily disabled',
    message: 'This feature requires schema updates. Contact support for details.'
  });
});

export default router;
