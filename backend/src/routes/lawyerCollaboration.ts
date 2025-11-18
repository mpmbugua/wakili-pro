import { Router } from 'express';
import { getMessages, sendMessage, getReferrals, createReferral, getForumPosts, addForumPost } from '../controllers/lawyerCollaborationController';

const router = Router();

router.get('/messages/:lawyerId', getMessages);
router.post('/messages/:lawyerId', sendMessage);
router.get('/referrals/:lawyerId', getReferrals);
router.post('/referrals/:lawyerId', createReferral);
router.get('/forum', getForumPosts);
router.post('/forum', addForumPost);

export default router;
