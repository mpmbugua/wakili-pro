import React from 'react';

export const PremiumBadge: React.FC = () => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-white text-xs font-bold rounded-full ml-2 align-middle"
    aria-label="Premium feature"
    role="img"
    tabIndex={0}
    title="Premium feature"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 17v.01M12 7v6m0 0a5 5 0 100 10 5 5 0 000-10z" /></svg>
    <span>Premium</span>
  </span>
);
