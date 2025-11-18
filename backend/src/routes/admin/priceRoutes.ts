import { Router } from 'express';
import { getPrices, createPrice, updatePrice, deletePrice } from '../../controllers/admin/priceController';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';

const router = Router();

// Require authentication and admin role for all price management endpoints
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', getPrices);
router.post('/', createPrice);
router.put('/:id', updatePrice);
router.delete('/:id', deletePrice);

export default router;
