import React, { useState } from 'react';
import axios from 'axios';

export const TwoFASettingsPage: React.FC = () => {
  const [method, setMethod] = useState<'TOTP' | 'EMAIL' | 'SMS'>('TOTP');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSetup = async () => {
    setError(null); setSuccess(null);
    try {
      const res = await axios.post('/api/security/2fa/setup', { method });
      setSecret(res.data.secret || '');
      setSuccess('2FA setup started. Enter the code to verify.');
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e && typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string') {
        setError((e as { response: { data: { message: string } } }).response.data.message);
      } else {
        setError('Setup failed');
      }
    }
  };

  const handleVerify = async () => {
    setError(null); setSuccess(null);
    try {
      await axios.post('/api/security/2fa/verify', { code });
      setEnabled(true);
      setSuccess('2FA enabled successfully!');
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e && typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string') {
        setError((e as { response: { data: { message: string } } }).response.data.message);
      } else {
        setError('Verification failed');
      }
    }
  };

  const handleDisable = async () => {
    setError(null); setSuccess(null);
    try {
      await axios.post('/api/security/2fa/disable');
      setEnabled(false);
      setSecret('');
      setSuccess('2FA disabled.');
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e && typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string') {
        setError((e as { response: { data: { message: string } } }).response.data.message);
      } else {
        setError('Disable failed');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-xl font-bold mb-4">Two-Factor Authentication (2FA)</h2>
      <div className="mb-4">
        <label className="block font-semibold mb-1">2FA Method</label>
        <select value={method} onChange={e => setMethod(e.target.value as 'TOTP' | 'EMAIL' | 'SMS')} className="border p-2 rounded w-full">
          <option value="TOTP">Authenticator App (TOTP)</option>
          <option value="EMAIL">Email Code</option>
          <option value="SMS">SMS Code</option>
        </select>
      </div>
      <button onClick={handleSetup} className="bg-blue-600 text-white py-2 px-4 rounded mb-4">Start 2FA Setup</button>
      {secret && method === 'TOTP' && (
        <div className="mb-2 text-xs text-gray-600">Secret: <span className="font-mono">{secret}</span> (scan QR in your app)</div>
      )}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Verification Code</label>
        <input value={code} onChange={e => setCode(e.target.value)} className="border p-2 rounded w-full" placeholder="Enter code from app/email/SMS" />
      </div>
      <button onClick={handleVerify} className="bg-green-600 text-white py-2 px-4 rounded mb-4">Verify & Enable 2FA</button>
      <button onClick={handleDisable} className="bg-red-600 text-white py-2 px-4 rounded ml-2">Disable 2FA</button>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {enabled && <div className="text-blue-700 mt-2">2FA is enabled for your account.</div>}
    </div>
  );
};

export default TwoFASettingsPage;
