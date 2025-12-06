import React, { useState } from 'react';
import { PasswordPolicyHint } from '@/components/auth/PasswordPolicyHint';
import { PasswordField } from '@/components/auth/PasswordField';
import { useAuthStore } from '@/store/authStore';

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const register = useAuthStore(s => s.register);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    const ok = await register({ ...form, role: 'PUBLIC' });
    if (ok) {
      setSuccess(true);
    } else {
      setError('Registration failed. Check your details.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      {success ? (
        <div className="text-green-600">Registration successful! Please log in.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" className="border p-2 w-full mb-2 rounded" required />
          <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" className="border p-2 w-full mb-2 rounded" required />
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 w-full mb-2 rounded" required />
          <PasswordPolicyHint />
          <PasswordField label="Password" value={form.password} onChange={handleChange} error={passwordError || undefined} />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button type="submit" className="w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 transition">Register</button>
        </form>
      )}
    </div>
  );
};

export default RegisterPage;
