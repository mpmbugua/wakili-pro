import React, { useEffect, useState } from 'react';
import { paymentService } from '@/services/paymentService';

export const AdminAppSettings: React.FC = () => {
  const [surcharge, setSurcharge] = useState('');
  const [commission, setCommission] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError(null);
      try {
        const res = await paymentService.getAppSettings();
        if (res?.success && res.data) {
          setSurcharge(res.data.emergency_surcharge || '');
          setCommission(res.data.booking_commission_percent || '');
        } else {
          setError('Could not fetch app settings.');
        }
      } catch (e) {
        setError('Could not fetch app settings.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Assume PATCH /app-settings with { emergency_surcharge, booking_commission_percent }
      const res = await paymentService.updateAppSettings({
        emergency_surcharge: surcharge,
        booking_commission_percent: commission
      });
      if (res?.success) {
        setSuccess('Settings updated successfully.');
      } else {
        setError(res?.message || 'Failed to update settings.');
      }
    } catch (e) {
      setError('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading app settings...</div>;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-xl mx-auto">
      <h2 className="font-bold text-lg mb-2">Emergency & Commission Settings</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="flex flex-col gap-3">
        <label>
          Emergency Surcharge (KES):
          <input
            type="number"
            className="ml-2 border p-1 rounded w-32"
            value={surcharge}
            onChange={e => setSurcharge(e.target.value)}
            min={0}
          />
        </label>
        <label>
          Booking Commission (%):
          <input
            type="number"
            className="ml-2 border p-1 rounded w-20"
            value={commission}
            onChange={e => setCommission(e.target.value)}
            min={0}
            max={100}
          />
        </label>
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
