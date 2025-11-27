import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Shield, FileText, AlertCircle, 
  TrendingUp, DollarSign, BarChart3, Plus, Settings, Eye,
  CheckCircle, XCircle, Clock, ArrowRight, Search
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader, StatCard, DataTable, Column } from '../ui';
import type { AuthUser } from '@wakili-pro/shared/src/types/auth';
import axiosInstance from '../../lib/axios';

interface AdminDashboardProps {
  user: AuthUser;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'PUBLIC' | 'LAWYER' | 'ADMIN';
  status: 'active' | 'suspended' | 'pending';
  joinedDate: string;
  lastActive: string;
}

interface LawyerApplication {
  id: string;
  name: string;
  email: string;
  specialization: string;
  experience: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface FlaggedContent {
  id: string;
  type: 'consultation' | 'message' | 'document';
  reportedBy: string;
  reason: string;
  date: string;
  status: 'pending' | 'resolved';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLawyers: 0,
    pendingApplications: 0,
    consultationsToday: 0,
    platformRevenue: 0,
    flaggedContent: 0,
    activeIssues: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [pendingLawyers, setPendingLawyers] = useState<LawyerApplication[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin stats
      const statsRes = await axiosInstance.get('/admin/lawyers/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      
      // Fetch pending lawyers
      const lawyersRes = await axiosInstance.get('/admin/lawyers/pending');
      if (lawyersRes.data.success) {
        const lawyers = lawyersRes.data.data.map((l: any) => ({
          id: l.id,
          name: `${l.user.firstName} ${l.user.lastName}`,
          email: l.user.email,
          specialization: l.specializations.join(', '),
          experience: `${l.yearsOfExperience} years`,
          submittedDate: new Date(l.createdAt).toLocaleDateString(),
          status: 'pending' as const
        }));
        setPendingLawyers(lawyers);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [growthData] = useState({
    users: { current: 0, previous: 0, change: 0 },
    revenue: { current: 0, previous: 0, change: 0 },
    consultations: { current: 0, previous: 0, change: 0 },
  });

  const flaggedItems: FlaggedContent[] = [];

  const userColumns: Column<User>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      render: (item) => {
        const colors = {
          PUBLIC: 'bg-blue-100 text-blue-700',
          LAWYER: 'bg-purple-100 text-purple-700',
          ADMIN: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.role]}`}>
            {item.role}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const colors = {
          active: 'bg-green-100 text-green-700',
          suspended: 'bg-red-100 text-red-700',
          pending: 'bg-amber-100 text-amber-700',
        };
        const icons = {
          active: CheckCircle,
          suspended: XCircle,
          pending: Clock,
        };
        const Icon = icons[item.status];
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[item.status]}`}>
            <Icon className="h-3 w-3" />
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
    { key: 'lastActive', label: 'Last Active' },
  ];

  const lawyerColumns: Column<LawyerApplication>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'specialization', label: 'Specialization', sortable: true },
    { key: 'experience', label: 'Experience' },
    { key: 'submittedDate', label: 'Submitted', sortable: true },
    {
      key: 'id',
      label: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/lawyers/${item.id}`);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
          <Button 
            size="sm" 
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              // Handle approve
            }}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              // Handle reject
            }}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const flaggedColumns: Column<FlaggedContent>[] = [
    {
      key: 'type',
      label: 'Type',
      render: (item) => {
        const colors = {
          message: 'bg-blue-100 text-blue-700',
          consultation: 'bg-purple-100 text-purple-700',
          document: 'bg-amber-100 text-amber-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.type]}`}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
        );
      },
    },
    { key: 'reportedBy', label: 'Reported By', sortable: true },
    { key: 'reason', label: 'Reason' },
    { key: 'date', label: 'Date', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const colors = {
          pending: 'bg-amber-100 text-amber-700',
          resolved: 'bg-green-100 text-green-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.status]}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Admin Dashboard`}
        subtitle={`Welcome, ${user.firstName}!`}
        description="Manage platform users, verify lawyers, and monitor system health"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/admin/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Analytics
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Platform Settings
            </Button>
          </>
        }
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={`+${growthData.users.change}%`}
          trend="up"
          icon={Users}
          iconColor="text-blue-600"
          description={`${stats.activeUsers} active`}
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Lawyers"
          value={stats.totalLawyers}
          change={`${stats.pendingApplications} pending`}
          trend="neutral"
          icon={UserCheck}
          iconColor="text-purple-600"
          description="Verified professionals"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/admin/lawyers')}
        />
        <StatCard
          title="Consultations"
          value={stats.consultationsToday}
          change={`+${growthData.consultations.change}%`}
          trend="up"
          icon={BarChart3}
          iconColor="text-emerald-600"
          description="Today"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/admin/consultations')}
        />
        <StatCard
          title="Platform Revenue"
          value={`KES ${(stats.platformRevenue / 1000000).toFixed(1)}M`}
          change={`+${growthData.revenue.change}%`}
          trend="up"
          icon={DollarSign}
          iconColor="text-amber-600"
          description="This month"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/admin/revenue')}
        />
      </div>

      {/* Alert Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pending Reviews</h3>
            </div>
            <span className="bg-amber-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {stats.pendingApplications}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Lawyer applications waiting for verification</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/lawyers?status=pending')}>
            Review Applications
          </Button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Flagged Content</h3>
            </div>
            <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {stats.flaggedContent}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Reports requiring moderation</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/moderation')}>
            View Reports
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Active Issues</h3>
            </div>
            <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {stats.activeIssues}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">System issues or user complaints</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/issues')}>
            Manage Issues
          </Button>
        </div>
      </div>

      {/* Platform Growth Overview */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-xl font-semibold mb-6">Platform Growth (Last 30 Days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm">User Growth</p>
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-sm text-blue-100 mt-1">+{growthData.users.change}% increase</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm">Revenue Growth</p>
              <DollarSign className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">KES {(stats.platformRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-sm text-blue-100 mt-1">+{growthData.revenue.change}% increase</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm">Consultation Growth</p>
              <BarChart3 className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{stats.consultationsToday}</p>
            <p className="text-sm text-blue-100 mt-1">+{growthData.consultations.change}% increase</p>
          </div>
        </div>
      </div>

      {/* Pending Lawyer Applications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pending Lawyer Applications</h3>
            <p className="text-sm text-gray-600 mt-1">Review and verify new lawyer registrations</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/lawyers?status=pending')}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <DataTable
          data={pendingLawyers}
          columns={lawyerColumns}
          onRowClick={(lawyer) => navigate(`/admin/lawyers/${lawyer.id}`)}
        />
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
            <p className="text-sm text-gray-600 mt-1">Latest user registrations and activity</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <DataTable
          data={recentUsers}
          columns={userColumns}
          onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
        />
      </div>

      {/* Flagged Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Flagged Content</h3>
            <p className="text-sm text-gray-600 mt-1">Content moderation and user reports</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/moderation')}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <DataTable
          data={flaggedItems}
          columns={flaggedColumns}
          onRowClick={(item) => navigate(`/admin/moderation/${item.id}`)}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/lawyers')}>
            <UserCheck className="h-4 w-4 mr-2" />
            Approve Lawyers
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/users')}>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Platform Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
