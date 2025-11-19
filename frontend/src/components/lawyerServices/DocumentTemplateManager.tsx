import React from 'react';
import { useLawyerDocumentTemplates } from '@/hooks/lawyerServices/useLawyerDocumentTemplates';

export const DocumentTemplateManager: React.FC = () => {
  const { templates, deleteTemplate, isLoading } = useLawyerDocumentTemplates();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Document Templates</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul className="mb-4">
          {templates.map(t => (
            <li key={t.id} className="border-b py-2 flex justify-between items-center">
              <span>{t.title}</span>
              <button className="text-red-500" onClick={() => deleteTemplate(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
      {/* Add form for creating/updating templates here */}
    </div>
  );
};
