import { Request, Response } from 'express';
import { LawyerDocumentTemplateService } from '../services/lawyerDocumentTemplatesService';

export const getTemplates = (req: Request, res: Response) => {
  const templates = LawyerDocumentTemplateService.getAll();
  res.json(templates);
};

export const createTemplate = (req: Request, res: Response) => {
  const template = LawyerDocumentTemplateService.create(req.body);
  res.status(201).json(template);
};

export const updateTemplate = (req: Request, res: Response) => {
  const template = LawyerDocumentTemplateService.update(req.params.id, req.body);
  res.json(template);
};

export const deleteTemplate = (req: Request, res: Response) => {
  LawyerDocumentTemplateService.delete(req.params.id);
  res.status(204).send();
};
