import { Router } from 'express';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/lawyerDocumentTemplatesController';

const router = Router();

router.get('/', getTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
