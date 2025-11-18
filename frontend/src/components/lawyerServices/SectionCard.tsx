import React from 'react';

export const SectionCard: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section
    id={id}
    className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-8 border border-blue-100 focus-within:ring-2 focus-within:ring-blue-300 transition-all duration-200"
    tabIndex={-1}
    aria-labelledby={`${id}-heading`}
  >
    <h2 id={`${id}-heading`} className="text-xl md:text-2xl font-bold mb-4 text-blue-700 tracking-tight">
      {title}
    </h2>
    {children}
  </section>
);
