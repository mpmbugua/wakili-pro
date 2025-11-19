import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';

interface EmergencyFeeBreakdownProps {
  lawyerFee: number;
  onProceed: (isEmergency: boolean) => void;
}

export const EmergencyFeeBreakdown: React.FC<EmergencyFeeBreakdownProps> = ({ lawyerFee, onProceed }) => {
  const [surcharge, setSurcharge] = useState<number | null>(null);
  const [commission, setCommission] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError(null);
      try {
        // Fetch admin settings for emergency surcharge and commission
        const res = await paymentService.getAppSettings();
        if (res?.success && res.data) {
          setSurcharge(Number(res.data.emergency_surcharge || 0));
          setCommission(Number(res.data.booking_commission_percent || 30));
        } else {
          setError('Could not fetch fee settings.');
        }
      } catch (e) {
        setError('Could not fetch fee settings.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  if (loading) return <div>Loading fee breakdown...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const total = lawyerFee + (surcharge || 0);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-lg mb-2">Emergency Booking Fee Breakdown</h3>
      <div className="flex flex-col gap-1">
        <div>Lawyer&apos;s Standard Fee: <span className="font-semibold">KES {lawyerFee}</span></div>
        <div>Emergency Surcharge: <span className="font-semibold">KES {surcharge}</span></div>
        <div className="font-bold mt-2">Total: <span className="text-indigo-700">KES {total}</span></div>
        <div className="text-xs text-gray-500 mt-1">* Commission ({commission}%) is deducted from the lawyer&apos;s fee. Surcharge is app revenue.</div>
      </div>
      <button
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        onClick={() => onProceed(true)}
      >
        Proceed to Emergency Payment
      </button>
    </div>
  );
};
