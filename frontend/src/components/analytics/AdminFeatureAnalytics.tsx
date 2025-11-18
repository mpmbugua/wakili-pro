import React, { useEffect, useState } from 'react';
import { analyticsService, EventStats } from '@/services/analyticsService';
// If Chart.js or Recharts is not installed, fallback to simple table for now
// import { Bar, Line } from 'react-chartjs-2';

export const AdminFeatureAnalytics: React.FC = () => {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // This endpoint should be implemented in backend to aggregate event stats
        const res = await analyticsService.fetchFeatureEventStats();
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setError(res.error || 'Failed to load analytics.');
        }
      } catch (e) {
        setError('Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div>Loading feature analytics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">AI & Emergency Feature Analytics</h2>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">AI Chat Usage</h3>
          <ul className="text-sm">
            <li>Total Messages: <span className="font-bold">{stats.aiChatMessages}</span></li>
            <li>Audio Played: <span className="font-bold">{stats.aiChatAudio}</span></li>
            <li>By Language:</li>
            <ul className="ml-4">
              {Object.entries(stats.aiChatByLanguage).map(([lang, count]) => (
                <li key={lang}>{lang}: <span className="font-bold">{count}</span></li>
              ))}
            </ul>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Emergency Connect Usage</h3>
          <ul className="text-sm">
            <li>Initiated: <span className="font-bold">{stats.emergencyInitiated}</span></li>
            <li>Successful Payments: <span className="font-bold">{stats.emergencySuccess}</span></li>
            <li>By Lawyer:</li>
            <ul className="ml-4">
              {Object.entries(stats.emergencyByLawyer).map(([lawyer, count]) => (
                <li key={lawyer}>{lawyer}: <span className="font-bold">{count}</span></li>
              ))}
            </ul>
          </ul>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Usage Timeline (last 30 days)</h3>
        <table className="w-full text-xs border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">AI Chat</th>
              <th className="border px-2 py-1">Emergency Connect</th>
            </tr>
          </thead>
          <tbody>
            {stats.timeline.map(row => (
              <tr key={row.date}>
                <td className="border px-2 py-1">{row.date}</td>
                <td className="border px-2 py-1">{row.aiChat}</td>
                <td className="border px-2 py-1">{row.emergency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
