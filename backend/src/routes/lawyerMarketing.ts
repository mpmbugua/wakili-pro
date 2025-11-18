import { Router } from 'express';
import { getProfile, updateProfile, getReviews, addReview, getSEOAnalytics } from '../controllers/lawyerMarketingController';

const router = Router();

router.get('/profile/:lawyerId', getProfile);
router.put('/profile/:lawyerId', updateProfile);
router.get('/reviews/:lawyerId', getReviews);
router.post('/reviews/:lawyerId', addReview);
router.get('/seo/:lawyerId', getSEOAnalytics);

export default router;
