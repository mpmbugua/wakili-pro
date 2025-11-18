import { Router } from 'express';
import { getCourses, enrollCourse, getProgress, getCertificate } from '../controllers/lawyerCLEController';

const router = Router();

router.get('/courses', getCourses);
router.post('/enroll', enrollCourse);
router.get('/progress/:userId', getProgress);
router.get('/certificate/:userId/:courseId', getCertificate);

export default router;
