import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';
import { listUsers, updateUser, changeUserRole, deactivateUser } from '../../../controllers/admin/users/userAdminController';

const router = Router();
router.use(authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'));

router.get('/', listUsers);
router.put('/:id', updateUser);
router.put('/:id/role', changeUserRole);
router.put('/:id/deactivate', deactivateUser);

export default router;
