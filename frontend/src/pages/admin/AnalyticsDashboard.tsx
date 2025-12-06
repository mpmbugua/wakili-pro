import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  Download,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import axiosInstance from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface AnalyticsOverview {
  totalVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  topPages: Array<{ page: string; views: number }>;
  topSearches: Array<{ query: string; count: number }>;
  deviceBreakdown: { mobile: number; tablet: number; desktop: number };
  geoData: Array<{ country: string; city: string; visitors: number }>;
  dailyStats: Array<{
    date: string;
    totalVisitors: number;
    totalPageViews: number;
    totalEvents: number;
    totalConversions: number;
    totalRevenue: number;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30); // Default: last 30 days

  // Redirect non-admin users
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);

        const response = await axiosInstance.get('/analytics-tracking/admin/overview', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });

        if (response.data.success) {
          setAnalytics(response.data.data);
        } else {
          setError('Failed to load analytics data');
        }
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const handleExportData = async (dataType: string, format: 'json' | 'csv') => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90); // Export last 90 days

      const response = await axiosInstance.get('/analytics-tracking/admin/export', {
        params: {
          dataType,
          format,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        // Download CSV file
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      alert(`${dataType} data exported successfully!`);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Admin
          </button>
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-red-600 text-lg">{error || 'No analytics data available'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Safe to access analytics properties here
  const totalDevices = 
    (analytics.deviceBreakdown?.mobile || 0) + 
    (analytics.deviceBreakdown?.tablet || 0) + 
    (analytics.deviceBreakdown?.desktop || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Admin
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
              <p className="text-slate-600 mt-1">Track visitor behavior and platform performance</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Visitors */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-slate-600 text-sm mb-1">Total Visitors</p>
            <p className="text-3xl font-bold text-slate-900">
              {(analytics.totalVisitors || 0).toLocaleString()}
            </p>
          </div>

          {/* Page Views */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-slate-600 text-sm mb-1">Page Views</p>
            <p className="text-3xl font-bold text-slate-900">
              {(analytics.totalPageViews || 0).toLocaleString()}
            </p>
          </div>

          {/* User Events */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-amber-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-slate-600 text-sm mb-1">User Events</p>
            <p className="text-3xl font-bold text-slate-900">
              {(analytics.totalEvents || 0).toLocaleString()}
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-slate-900">
              {(analytics.conversionRate || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {analytics.conversions || 0} conversions / KES {(analytics.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Pages */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Top Pages</h2>
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {(analytics.topPages || []).slice(0, 10).map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {page.page}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${analytics.topPages?.[0]?.views ? (page.views / analytics.topPages[0].views) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 w-12 text-right">
                      {(page.views || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!analytics.topPages || analytics.topPages.length === 0) && (
                <p className="text-slate-500 text-center py-4">No page data available</p>
              )}
            </div>
          </div>

          {/* Top Searches */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Top Searches</h2>
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {(analytics.topSearches || []).slice(0, 10).map((search, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {search.query}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${analytics.topSearches?.[0]?.count ? (search.count / analytics.topSearches[0].count) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 w-12 text-right">
                      {search.count || 0}
                    </p>
                  </div>
                </div>
              ))}
              {(!analytics.topSearches || analytics.topSearches.length === 0) && (
                <p className="text-slate-500 text-center py-4">No search data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Device & Geography */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Device Breakdown */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Device Breakdown</h2>
              <Smartphone className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-700">Mobile</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: totalDevices > 0 
                          ? `${(analytics.deviceBreakdown.mobile / totalDevices) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-16 text-right">
                    {totalDevices > 0 
                      ? ((analytics.deviceBreakdown.mobile / totalDevices) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tablet className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700">Tablet</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: totalDevices > 0 
                          ? `${(analytics.deviceBreakdown.tablet / totalDevices) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-16 text-right">
                    {totalDevices > 0 
                      ? ((analytics.deviceBreakdown.tablet / totalDevices) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-amber-600" />
                  <span className="text-slate-700">Desktop</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{
                        width: totalDevices > 0 
                          ? `${(analytics.deviceBreakdown.desktop / totalDevices) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-16 text-right">
                    {totalDevices > 0 
                      ? ((analytics.deviceBreakdown.desktop / totalDevices) * 100).toFixed(1)
                      : '0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Data */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Top Locations</h2>
              <MapPin className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {(analytics.geoData || []).slice(0, 8).map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {location.city}, {location.country}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {(location.visitors || 0).toLocaleString()} visitors
                  </p>
                </div>
              ))}
              {(!analytics.geoData || analytics.geoData.length === 0) && (
                <p className="text-slate-500 text-center py-4">No location data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Stats Chart (Simple Table View) */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Daily Statistics</h2>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Visitors</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Page Views</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Events</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Conversions</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.dailyStats || []).slice(0, 14).map((day, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-slate-900">
                      {(day.totalVisitors || 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-slate-900">
                      {(day.totalPageViews || 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-slate-900">
                      {(day.totalEvents || 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-slate-900">
                      {day.totalConversions || 0}
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-semibold text-green-600">
                      KES {(day.totalRevenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!analytics.dailyStats || analytics.dailyStats.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No daily statistics available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Export Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Data Export</h2>
              <p className="text-sm text-slate-600 mt-1">
                Export data for AI training, market analysis, and reporting (last 90 days)
              </p>
            </div>
            <Download className="w-5 h-5 text-slate-400" />
          </div>

          {/* Advanced AI Tools Button */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Advanced AI Data Tools</h3>
                  <p className="text-sm text-slate-600">
                    Query builder, anonymization, and market intelligence reports
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/ai-data-export')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition flex items-center gap-2"
              >
                Open AI Tools
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Queries Export */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Search Queries</h3>
              <p className="text-sm text-slate-600 mb-4">
                All user search queries for AI training
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportData('searches', 'json')}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExportData('searches', 'csv')}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* User Journeys Export */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">User Journeys</h3>
              <p className="text-sm text-slate-600 mb-4">
                Complete user sessions and conversion paths
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportData('user-journeys', 'json')}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExportData('user-journeys', 'csv')}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Page Analytics Export */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Page Analytics</h3>
              <p className="text-sm text-slate-600 mb-4">
                Page views with duration and engagement metrics
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportData('page-analytics', 'json')}
                  className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExportData('page-analytics', 'csv')}
                  className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
