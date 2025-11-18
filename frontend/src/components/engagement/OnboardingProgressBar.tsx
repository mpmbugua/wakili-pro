import React from 'react';

export const OnboardingProgressBar: React.FC<{ step: string; completed: boolean }> = ({ step, completed }) => (
  <div className="mt-4">
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
      <div className={`bg-blue-600 h-2.5 rounded-full transition-all`} style={{ width: completed ? '100%' : '50%' }} />
    </div>
    <div className="text-xs text-gray-600">Onboarding Step: {step} {completed ? '(Completed)' : ''}</div>
  </div>
);
