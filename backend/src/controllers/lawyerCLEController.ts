import { Request, Response } from 'express';
import { LawyerCLEService } from '../services/lawyerCLES ervice';

export const getCourses = (req: Request, res: Response) => {
  const courses = LawyerCLEService.getAllCourses();
  res.json(courses);
};

export const enrollCourse = (req: Request, res: Response) => {
  const enrollment = LawyerCLEService.enroll(req.body.userId, req.body.courseId);
  res.status(201).json(enrollment);
};

export const getProgress = (req: Request, res: Response) => {
  const progress = LawyerCLEService.getProgress(req.params.userId);
  res.json(progress);
};

export const getCertificate = (req: Request, res: Response) => {
  const certificate = LawyerCLEService.getCertificate(req.params.userId, req.params.courseId);
  res.json(certificate);
};
