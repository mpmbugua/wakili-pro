import React from 'react';

export const PasswordPolicyHint: React.FC = () => (
  <ul className="text-xs text-gray-600 mb-2 list-disc pl-5">
    <li>At least 10 characters</li>
    <li>At least one uppercase letter</li>
    <li>At least one lowercase letter</li>
    <li>At least one number</li>
    <li>At least one symbol (!@#$%^&amp;*)</li>
  </ul>
);
