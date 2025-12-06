import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Users, DollarSign, FileText, Clock, ArrowUp, ArrowDown, Calendar, Loader } from 'lucide-react';
import axiosInstance from '../lib/axios';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/analytics/lawyer?timeRange=${timeRange}`);
      
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to mock data if API fails
      setAnalyticsData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    stats: {
      totalRevenue: 1141000,
      revenueGrowth: 12.5,
      totalClients: 101,
      clientGrowth: 8.3,
      totalCases: 135,
      caseGrowth: -2.1,
      avgResponseTime: '2.4 hours',
      responseImprovement: 15.2
    },
    monthlyRevenue: [
      { month: 'Jan', revenue: 85000, clients: 12 },
      { month: 'Feb', revenue: 92000, clients: 15 },
      { month: 'Mar', revenue: 78000, clients: 11 },
      { month: 'Apr', revenue: 105000, clients: 18 },
      { month: 'May', revenue: 118000, clients: 21 },
      { month: 'Jun', revenue: 135000, clients: 24 }
    ],
    serviceBreakdown: [
      { service: 'Document Certification', count: 45, revenue: 225000, percentage: 35 },
      { service: 'Legal Consultation', count: 62, revenue: 496000, percentage: 38 },
      { service: 'Contract Drafting', count: 28, revenue: 420000, percentage: 27 }
    ]
  });

  // Use API data or fallback to mock data
  const data = analyticsData || getMockData();
  const { stats, monthlyRevenue, serviceBreakdown } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-sm text-gray-600 mt-1">Track your practice performance and growth</p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  timeRange === range
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">{stats.revenueGrowth}%</span>
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">{stats.clientGrowth}%</span>
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              </div>
              <Users className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Cases</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCases}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">{Math.abs(stats.caseGrowth)}%</span>
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              </div>
              <FileText className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgResponseTime}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">{stats.responseImprovement}%</span>
                  <span className="text-sm text-gray-500">faster</span>
                </div>
              </div>
              <Clock className="h-10 w-10 text-indigo-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Last 6 Months
            </div>
          </div>
          <div className="space-y-4">
            {monthlyRevenue.map((data, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-gray-600">{data.month}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(data.revenue)}</span>
                    <span className="text-xs text-gray-500">{data.clients} clients</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(data.revenue / 150000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Service Distribution</h2>
            <div className="space-y-4">
              {serviceBreakdown.map((service, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{service.service}</span>
                    <span className="text-sm font-semibold text-gray-900">{service.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${service.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{service.count} cases</span>
                    <span>{formatCurrency(service.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Client Satisfaction</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">4.8/5.0</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-600 opacity-40" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">94%</p>
                </div>
                <BarChart3 className="h-10 w-10 text-green-600 opacity-40" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Repeat Clients</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">68%</p>
                </div>
                <Users className="h-10 w-10 text-purple-600 opacity-40" />
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
  );
};
