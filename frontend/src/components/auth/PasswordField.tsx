import React, { useState } from 'react';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  name?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, onChange, error, name = 'password' }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          className={`border p-2 w-full rounded ${error ? 'border-red-500' : ''}`}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-xs text-blue-600"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};
