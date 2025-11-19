import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Clock, Star,
  Calendar, Download, RefreshCw
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { AdminFeatureAnalytics } from './AdminFeatureAnalytics';

interface RecentActivity {
  id: string;
  type: 'consultation' | 'payment' | 'registration' | 'service';
  description: string;
  timestamp: Date;
  amount?: number;
  service: {
    title: string;
    type: string;
  };
  client: {
    firstName: string;
    lastName: string;
  };
  provider: {
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  consultations: number;
}

interface RevenueByService {
  serviceType: string;
  revenue: number;
  count: number;
  [key: string]: string | number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  percentage: number;
}

interface AnalyticsData {
  overview: {
    totalBookings: number;
    totalRevenue: number;
    activeConsultations: number;
    completedServices: number;
    averageRating: number;
  };
  recentActivity: RecentActivity[];
  monthlyRevenue: MonthlyRevenue[];
  revenueByService: RevenueByService[];
  paymentMethodStats: PaymentMethodStats[];
}

interface PerformanceData {
  consultations: {
    total: number;
    averageDuration: number;
  };
  satisfaction: {
    averageRating: number;
    totalReviews: number;
  };
  responseTime: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'performance'>('overview');

  const loadAnalyticsData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardData, revenueData, perfData] = await Promise.allSettled([
        analyticsService.getDashboardAnalytics({ dateRange }),
        analyticsService.getRevenueAnalytics({ dateRange }),
        analyticsService.getPerformanceAnalytics({ dateRange })
      ]);

      if (dashboardData.status === 'fulfilled' && dashboardData.value.success && dashboardData.value.data) {
        const revData = revenueData.status === 'fulfilled' && revenueData.value.success 
          ? revenueData.value.data : {};
        
        setAnalyticsData({
          overview: dashboardData.value.data.overview || {
            totalBookings: 0,
            totalRevenue: 0,
            activeConsultations: 0,
            completedServices: 0,
            averageRating: 0
          },
          recentActivity: dashboardData.value.data.recentActivity || [],
          monthlyRevenue: [],
          revenueByService: [],
          paymentMethodStats: [],
          ...revData
        });
      }

      if (perfData.status === 'fulfilled' && perfData.value.success) {
        setPerformanceData(perfData.value.data || null);
      }

    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  React.useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, loadAnalyticsData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportData = async () => {
    try {
      const response = await analyticsService.exportAnalytics({ dateRange });
      if (response.success) {
        // Create download link
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange.start}-${dateRange.end}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into your legal practice</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Range Filter */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <button
                onClick={exportData}
                className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 border-b">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'revenue', label: 'Revenue' },
              { key: 'performance', label: 'Performance' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'revenue' | 'performance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && analyticsData && (
          <div className="space-y-8">
            <AdminFeatureAnalytics />
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <MetricCard
                title="Total Bookings"
                value={analyticsData.overview.totalBookings}
                icon={Users}
                trend="+12%"
                trendUp={true}
              />
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(analyticsData.overview.totalRevenue)}
                icon={DollarSign}
                trend="+8%"
                trendUp={true}
              />
              <MetricCard
                title="Active Consultations"
                value={analyticsData.overview.activeConsultations}
                icon={Clock}
                trend="-2%"
                trendUp={false}
              />
              <MetricCard
                title="Completed Services"
                value={analyticsData.overview.completedServices}
                icon={TrendingUp}
                trend="+15%"
                trendUp={true}
              />
              <MetricCard
                title="Average Rating"
                value={analyticsData.overview.averageRating.toFixed(1)}
                icon={Star}
                trend="+0.2"
                trendUp={true}
              />
            </div>

            {/* Revenue Trend Chart */}
            {analyticsData.monthlyRevenue && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value: string | number) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                    />
                    <YAxis tickFormatter={(value: string | number) => formatCurrency(Number(value))} />
                    <Tooltip 
                      labelFormatter={(value: string | number) => new Date(value).toLocaleDateString()}
                      formatter={(value: string | number) => [formatCurrency(Number(value)), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Service Type Distribution */}
            {analyticsData.revenueByService && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.revenueByService}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {analyticsData.revenueByService.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: string | number) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.paymentMethodStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis tickFormatter={(value: string | number) => formatCurrency(Number(value))} />
                      <Tooltip formatter={(value: string | number) => [formatCurrency(Number(value)), 'Amount']} />
                      <Bar dataKey="_sum.amount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.recentActivity.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{activity.service.title}</div>
                          <div className="text-sm text-gray-500">{activity.service.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.client.firstName} {activity.client.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.provider.firstName} {activity.provider.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={activity.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && performanceData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Consultations</h3>
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {performanceData.consultations.total}
                </div>
                <p className="text-sm text-gray-600">
                  Avg. {Math.round(performanceData.consultations.averageDuration || 0)} min
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Satisfaction</h3>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {performanceData.satisfaction.averageRating.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">
                  {performanceData.satisfaction.totalReviews} reviews
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {Math.round(performanceData.responseTime || 0)}
                </div>
                <p className="text-sm text-gray-600">minutes average</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  trendUp: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className="h-8 w-8 text-indigo-600" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <div className={`flex items-center text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          {trend}
        </div>
      </div>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default AdvancedAnalyticsDashboard;