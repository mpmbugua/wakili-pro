import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { adminService } from '@/services/adminService';
import type { AdminAnalytics, UserBehaviorAnalytics } from '@/services/adminService';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'behavior', label: 'User Behavior' },
  { key: 'platform', label: 'Platform Metrics' },
  { key: 'trends', label: 'Trends' }
];

function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [userBehavior, setUserBehavior] = useState<UserBehaviorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'behavior' | 'platform' | 'trends'>('overview');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      adminService.getAdminAnalytics(dateRange),
      adminService.getUserBehaviorAnalytics(dateRange)
    ])
      .then(([analyticsData, userBehaviorData]) => {
        setAnalytics(analyticsData);
        setUserBehavior(userBehaviorData);
      })
      .catch((err) => {
        setError('Failed to load analytics');
        console.error('Load analytics error:', err);
      })
      .finally(() => setLoading(false));
  }, [dateRange]);
  const [loading, setLoading] = useState(true);
=======
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { adminService } from '@/services/adminService';
import type { AdminAnalytics, UserBehaviorAnalytics } from '@/services/adminService';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'behavior', label: 'User Behavior' },
  { key: 'platform', label: 'Platform Metrics' },
  { key: 'trends', label: 'Trends' }
];

function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [userBehavior, setUserBehavior] = useState<UserBehaviorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'behavior' | 'platform' | 'trends'>('overview');

  useEffect(() => {
<<<<<<< HEAD
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - will integrate with backend admin analytics API
      const mockAnalytics: AdminAnalytics = {
        overview: {
          totalUsers: 1247,
          totalLawyers: 89,
          totalRevenue: 125430.50,
          monthlyActiveUsers: 786,
          conversionRate: 12.8,
          averageSessionDuration: 8.5
        },
        userBehavior: {
          pageViews: [
            { page: '/dashboard', views: 4520, avgTime: 3.2 },
            { page: '/marketplace', views: 3890, avgTime: 5.1 },
            { page: '/consultation', views: 2340, avgTime: 12.4 },
            { page: '/ai-assistant', views: 2100, avgTime: 7.8 },
            { page: '/profile', views: 1560, avgTime: 4.5 }
          ],
          userFlows: [
            { from: '/landing', to: '/register', count: 450 },
            { from: '/register', to: '/dashboard', count: 380 },
            { from: '/dashboard', to: '/marketplace', count: 320 },
            { from: '/marketplace', to: '/consultation', count: 180 },
            { from: '/consultation', to: '/payment', count: 140 }
          ],
          dropOffPoints: [
            { step: 'Registration Form', dropOffRate: 24.5 },
            { step: 'Email Verification', dropOffRate: 18.2 },
            { step: 'Profile Completion', dropOffRate: 32.1 },
            { step: 'First Consultation Booking', dropOffRate: 41.8 },
            { step: 'Payment Process', dropOffRate: 12.3 }
          ]
        },
        platformMetrics: {
          consultationStats: {
            total: 1456,
            completed: 1284,
            cancelled: 172,
            avgDuration: 45.6,
            satisfaction: 4.3
          },
          paymentStats: {
            totalTransactions: 2340,
            successRate: 94.2,
            avgTransactionValue: 5600,
            refundRate: 2.1
          },
          lawyerMetrics: {
            averageRating: 4.4,
            responseTime: 2.3,
            completionRate: 88.2
          }
        },
        timeSeriesData: {
          userGrowth: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            users: 1000 + Math.floor(Math.random() * 300),
            lawyers: 70 + Math.floor(Math.random() * 25)
          })),
          revenueGrowth: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            revenue: 3000 + Math.floor(Math.random() * 2000),
            transactions: 15 + Math.floor(Math.random() * 10)
          })),
          engagementMetrics: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            sessions: 200 + Math.floor(Math.random() * 150),
            duration: 6 + Math.random() * 4
          }))
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (err) {
      console.error('Load analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0
      }).format(amount);
    const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
    const formatDuration = (minutes: number) => {
      if (minutes < 60) return `${minutes.toFixed(1)}m`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins.toFixed(0)}m`;
    };
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
<<<<<<< HEAD
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(1)}m`;
    }
=======
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toFixed(0)}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }
<<<<<<< HEAD
=======
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-600 font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <Button className="mt-4" onClick={() => setDateRange(dateRange)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
<<<<<<< HEAD
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
                Admin Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Deep insights into platform performance and user behavior
              </p>
            </div>
            
=======
              <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
              <p className="text-gray-600 mt-1">Deep insights into platform performance and user behavior</p>
            </div>
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="365d">Last year</option>
              </select>
<<<<<<< HEAD
              
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'behavior', label: 'User Behavior', icon: Eye },
                { key: 'platform', label: 'Platform Metrics', icon: Activity },
                { key: 'trends', label: 'Trends', icon: LineChart }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'overview' | 'behavior' | 'platform' | 'trends')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
=======
            </div>
          </div>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
<<<<<<< HEAD
                  <tab.icon className="w-4 h-4 mr-2" />
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
<<<<<<< HEAD

=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
<<<<<<< HEAD
            {/* Key Metrics */}
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
<<<<<<< HEAD
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {analytics.overview.totalUsers.toLocaleString()}
                      </p>
<<<<<<< HEAD
                      <div className="flex items-center text-sm text-green-600">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +12.3% from last month
                      </div>
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                    </div>
                  </div>
                </CardContent>
              </Card>
<<<<<<< HEAD

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
=======
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics.overview.totalRevenue)}
                      </p>
<<<<<<< HEAD
                      <div className="flex items-center text-sm text-green-600">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +8.7% from last month
                      </div>
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                    </div>
                  </div>
                </CardContent>
              </Card>
<<<<<<< HEAD

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Monthly Active Users</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {analytics.overview.monthlyActiveUsers.toLocaleString()}
                      </p>
                      <div className="flex items-center text-sm text-red-600">
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        -2.1% from last month
                      </div>
=======
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Lawyers</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {analytics.overview.totalLawyers}
                      </p>
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
<<<<<<< HEAD

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatPercentage(analytics.overview.conversionRate)}
                  </div>
                  <p className="text-gray-600">Visitor to registered user conversion</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg Session Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatDuration(analytics.overview.averageSessionDuration)}
                  </div>
                  <p className="text-gray-600">Average time spent per session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Lawyers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {analytics.overview.totalLawyers}
                  </div>
                  <p className="text-gray-600">Verified legal practitioners</p>
=======
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {analytics.overview.pendingVerifications}
                  </div>
                  <p className="text-gray-600">Lawyer applications awaiting review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Consultations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {analytics.overview.activeConsultations}
                  </div>
                  <p className="text-gray-600">Ongoing legal consultations</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatCurrency(analytics.overview.monthlyRevenue)}
                  </div>
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                </CardContent>
              </Card>
            </div>
          </div>
        )}
<<<<<<< HEAD

        {/* User Behavior Tab */}
        {activeTab === 'behavior' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Page Views */}
=======
        {/* User Behavior Tab */}
        {activeTab === 'behavior' && userBehavior && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
              <Card>
                <CardHeader>
                  <CardTitle>Top Page Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
<<<<<<< HEAD
                    {analytics.userBehavior.pageViews.map((page, index) => (
=======
                    {userBehavior.pageViews.map((page, index) => (
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{page.page}</p>
                          <p className="text-sm text-gray-600">{formatDuration(page.avgTime)} avg time</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{page.views.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
<<<<<<< HEAD

              {/* Drop-off Points */}
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
              <Card>
                <CardHeader>
                  <CardTitle>User Drop-off Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
<<<<<<< HEAD
                    {analytics.userBehavior.dropOffPoints.map((point, index) => (
=======
                    {userBehavior.dropOffPoints.map((point, index) => (
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{point.step}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            point.dropOffRate > 30 ? 'text-red-600' : 
                            point.dropOffRate > 20 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {formatPercentage(point.dropOffRate)}
                          </p>
                          <p className="text-sm text-gray-600">drop-off</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
<<<<<<< HEAD

            {/* User Flow */}
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
            <Card>
              <CardHeader>
                <CardTitle>User Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<<<<<<< HEAD
                  {analytics.userBehavior.userFlows.map((flow, index) => (
=======
                  {userBehavior.userFlows.map((flow, index) => (
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">From: {flow.from}</span>
                        <span className="font-semibold text-gray-900">{flow.count}</span>
                      </div>
<<<<<<< HEAD
                      <div className="text-center my-2">
                        <ArrowUpRight className="w-4 h-4 mx-auto text-gray-400" />
                      </div>
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                      <div className="text-sm text-gray-600 text-center">To: {flow.to}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
<<<<<<< HEAD

        {/* Platform Metrics Tab */}
        {activeTab === 'platform' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Consultation Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Consultation Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Consultations</span>
                    <span className="font-semibold">{analytics.platformMetrics.consultationStats.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-semibold text-green-600">
                      {analytics.platformMetrics.consultationStats.completed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cancelled</span>
                    <span className="font-semibold text-red-600">
                      {analytics.platformMetrics.consultationStats.cancelled.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Duration</span>
                    <span className="font-semibold">
                      {formatDuration(analytics.platformMetrics.consultationStats.avgDuration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Satisfaction</span>
                    <span className="font-semibold">
                      {analytics.platformMetrics.consultationStats.satisfaction}/5.0
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Transactions</span>
                    <span className="font-semibold">
                      {analytics.platformMetrics.paymentStats.totalTransactions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">
                      {formatPercentage(analytics.platformMetrics.paymentStats.successRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Transaction</span>
                    <span className="font-semibold">
                      {formatCurrency(analytics.platformMetrics.paymentStats.avgTransactionValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Rate</span>
                    <span className="font-semibold text-yellow-600">
                      {formatPercentage(analytics.platformMetrics.paymentStats.refundRate)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Lawyer Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Lawyer Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-semibold">
                      {analytics.platformMetrics.lawyerMetrics.averageRating}/5.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold">
                      {analytics.platformMetrics.lawyerMetrics.responseTime}h avg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-green-600">
                      {formatPercentage(analytics.platformMetrics.lawyerMetrics.completionRate)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

=======
        {/* Platform Metrics Tab */}
        {activeTab === 'platform' && (
          <div className="space-y-6 text-center text-gray-500">
            <div className="py-12">
              <div className="mx-auto mb-4 w-12 h-12 bg-gray-200 rounded-full" />
              <div className="text-lg">No platform metrics available.</div>
              <div className="text-sm mt-2">This section will display more detailed platform metrics when available from the backend.</div>
            </div>
          </div>
        )}
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
        {/* Trends Tab */}
        {activeTab === 'trends' && analytics && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
<<<<<<< HEAD
                <CardTitle>Growth Trends</CardTitle>
=======
                <CardTitle>User & Revenue Growth</CardTitle>
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
<<<<<<< HEAD
                    <h4 className="text-lg font-semibold mb-4">User Growth (30 days)</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        +{Math.floor(Math.random() * 200) + 100} users
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPercentage(12.3)} increase from previous period
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Revenue Growth (30 days)</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        +{formatCurrency(Math.floor(Math.random() * 20000) + 10000)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPercentage(8.7)} increase from previous period
=======
                    <h4 className="text-lg font-semibold mb-4">User Growth</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        +{analytics.userGrowth.length > 1 ? analytics.userGrowth[analytics.userGrowth.length-1].users - analytics.userGrowth[0].users : 0} users
                      </div>
                      <div className="text-sm text-gray-600">
                        {analytics.userGrowth.length} days tracked
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Revenue Growth</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        +{analytics.revenue.length > 1 ? formatCurrency(analytics.revenue[analytics.revenue.length-1].amount - analytics.revenue[0].amount) : formatCurrency(0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {analytics.revenue.length} months tracked
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
<<<<<<< HEAD

            <Card>
              <CardHeader>
                <CardTitle>Platform Health Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">98.7%</div>
                    <div className="text-gray-600">System Uptime</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">1.2s</div>
                    <div className="text-gray-600">Avg Response Time</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">4.6/5</div>
                    <div className="text-gray-600">User Satisfaction</div>
                  </div>
                </div>
              </CardContent>
            </Card>
=======
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
          </div>
        )}
      </div>
    </div>
  );
<<<<<<< HEAD
};

export default AdminAnalyticsDashboard;
=======
}

export default AdminAnalyticsDashboard;
// Removed duplicate and stray JSX after export. File now ends cleanly after export default.
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
