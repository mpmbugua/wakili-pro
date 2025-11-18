import React, { useState } from 'react';
import { DocumentTemplate } from '@shared/types/ai';

interface AIPromptVariable {
  name: string;
  label: string;
  required?: boolean;
}

interface Props {
  template: DocumentTemplate;
  onPurchase: (template: DocumentTemplate, aiInput: Record<string, string>) => void;
}

const DocumentPurchaseModal: React.FC<Props> = ({ template, onPurchase }) => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    onPurchase(template, form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <h2 className="text-xl font-bold mb-4">Purchase: {template.title}</h2>
        <form onSubmit={handleSubmit}>
          {(template.aiPromptConfig?.variables as AIPromptVariable[] | undefined)?.map((v) => (
            <div key={v.name} className="mb-4">
              <label className="block text-sm font-medium mb-1">{v.label}</label>
              <input
                type="text"
                name={v.name}
                required={v.required}
                className="w-full border rounded px-3 py-2"
                onChange={handleChange}
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : `Pay KES ${template.priceKES}`}
          </button>
        </form>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={() => onPurchase(null, null)}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default DocumentPurchaseModal;
