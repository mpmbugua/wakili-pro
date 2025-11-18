import { Router } from 'express';
import { setup2FA, verify2FA, disable2FA } from '../../controllers/security/twoFAController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/setup', setup2FA);
router.post('/verify', verify2FA);
router.post('/disable', disable2FA);

export default router;
