import { LawyerDocumentTemplate } from '@wakili-pro/shared';

const templates: LawyerDocumentTemplate[] = [];

export const LawyerDocumentTemplateService = {
  getAll: () => templates,
  create: (data: LawyerDocumentTemplate) => {
    templates.push(data);
    return data;
  },
  update: (id: string, data: Partial<LawyerDocumentTemplate>) => {
    const idx = templates.findIndex(t => t.id === id);
    if (idx !== -1) {
      templates[idx] = { ...templates[idx], ...data };
      return templates[idx];
    }
    return null;
  },
  delete: (id: string) => {
    const idx = templates.findIndex(t => t.id === id);
    if (idx !== -1) templates.splice(idx, 1);
  },
};
