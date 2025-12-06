import React, { useState } from 'react';
import { PasswordPolicyHint } from '@/components/auth/PasswordPolicyHint';
import { PasswordField } from '@/components/auth/PasswordField';
import { useAuthStore } from '@/store/authStore';

export const ChangePasswordPage: React.FC = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const changePassword = useAuthStore(s => s.changePassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    const ok = await changePassword(form.currentPassword, form.newPassword);
    if (ok) {
      setSuccess(true);
    } else {
      setError('Password change failed. Check your details.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-4">Change Password</h2>
      {success ? (
        <div className="text-green-600">Password changed successfully!</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <PasswordField label="Current Password" name="currentPassword" value={form.currentPassword} onChange={handleChange} />
          <PasswordPolicyHint />
          <PasswordField label="New Password" name="newPassword" value={form.newPassword} onChange={handleChange} error={passwordError || undefined} />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button type="submit" className="w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 transition">Change Password</button>
        </form>
      )}
    </div>
  );
};

export default ChangePasswordPage;
