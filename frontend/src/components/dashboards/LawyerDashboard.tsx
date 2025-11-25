import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MessageSquare, FileText, Video, Clock, Plus, ArrowRight,
  Users, DollarSign, TrendingUp, CheckCircle, AlertCircle, BarChart3, User
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader, StatCard, DataTable, Column } from '../ui';
import type { AuthUser } from '@wakili-pro/shared/src/types/auth';

interface LawyerDashboardProps {
  user: AuthUser;
}

interface Consultation {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  type: string;
  fee?: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  activeCase: string;
  lastContact: string;
}

export const LawyerDashboard: React.FC<LawyerDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  
  const [stats] = useState({
    activeClients: 24,
    consultationsThisMonth: 18,
    revenue: 245000,
    completionRate: 94,
    pendingConsultations: 5,
    totalDocuments: 156,
  });

  const upcomingConsultations: Consultation[] = [
    { 
      id: '1', 
      clientName: 'John Kamau', 
      date: '2025-11-25', 
      time: '10:00 AM', 
      type: 'Contract Review',
      status: 'upcoming',
      fee: 15000
    },
    { 
      id: '2', 
      clientName: 'Mary Wanjiku', 
      date: '2025-11-25', 
      time: '2:00 PM', 
      type: 'Court Representation',
      status: 'upcoming',
      fee: 35000
    },
    { 
      id: '3', 
      clientName: 'Peter Ochieng', 
      date: '2025-11-26', 
      time: '11:30 AM', 
      type: 'Legal Consultation',
      status: 'upcoming',
      fee: 12000
    },
  ];

  const recentClients: Client[] = [
    { 
      id: '1', 
      name: 'Sarah Njeri', 
      email: 'sarah.njeri@email.com', 
      phone: '+254 712 345 678',
      activeCase: 'Property Dispute',
      lastContact: '2 hours ago'
    },
    { 
      id: '2', 
      name: 'David Otieno', 
      email: 'david.otieno@email.com', 
      phone: '+254 723 456 789',
      activeCase: 'Business Formation',
      lastContact: '1 day ago'
    },
    { 
      id: '3', 
      name: 'Grace Mwangi', 
      email: 'grace.mwangi@email.com', 
      phone: '+254 734 567 890',
      activeCase: 'Employment Contract',
      lastContact: '3 days ago'
    },
  ];

  const performanceData = {
    thisMonth: { consultations: 18, revenue: 245000 },
    lastMonth: { consultations: 15, revenue: 198000 },
  };

  const revenueChange = ((performanceData.thisMonth.revenue - performanceData.lastMonth.revenue) / performanceData.lastMonth.revenue * 100).toFixed(1);
  const consultationChange = ((performanceData.thisMonth.consultations - performanceData.lastMonth.consultations) / performanceData.lastMonth.consultations * 100).toFixed(1);

  const consultationColumns: Column<Consultation>[] = [
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'time', label: 'Time' },
    {
      key: 'fee',
      label: 'Fee',
      render: (item) => (
        <span className="font-medium text-gray-900">
          KES {item.fee?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const colors = {
          upcoming: 'bg-blue-100 text-blue-700',
          completed: 'bg-green-100 text-green-700',
          cancelled: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.status]}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
  ];

  const clientColumns: Column<Client>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'activeCase', label: 'Active Case', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'lastContact', label: 'Last Contact' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, Advocate ${user.firstName}!`}
        subtitle="Lawyer Dashboard"
        description="Manage your legal practice, consultations, and client relationships"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/profile/settings')}>
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
            <Button variant="outline" onClick={() => navigate('/calendar')}>
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Button variant="primary" onClick={() => navigate('/consultations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Consultation
            </Button>
          </>
        }
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          change="+3 this week"
          trend="up"
          icon={Users}
          iconColor="text-blue-600"
          description="Total clients"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/clients')}
        />
        <StatCard
          title="Consultations"
          value={stats.consultationsThisMonth}
          change={`+${consultationChange}%`}
          trend="up"
          icon={Video}
          iconColor="text-emerald-600"
          description="This month"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/consultations')}
        />
        <StatCard
          title="Revenue"
          value={`KES ${(stats.revenue / 1000).toFixed(0)}K`}
          change={`+${revenueChange}%`}
          trend="up"
          icon={DollarSign}
          iconColor="text-purple-600"
          description="This month"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/analytics')}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          change="+2%"
          trend="up"
          icon={CheckCircle}
          iconColor="text-amber-600"
          description="Case success"
          className="hover:shadow-lg transition-all duration-200"
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">This Month</h3>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-blue-100 text-sm">Consultations</p>
              <p className="text-2xl font-bold">{performanceData.thisMonth.consultations}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Revenue</p>
              <p className="text-2xl font-bold">KES {(performanceData.thisMonth.revenue / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Consultations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingConsultations}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/consultations?status=pending')}>
              View Pending
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
              Manage Files
            </Button>
          </div>
        </div>
      </div>

      {/* Upcoming Consultations Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Consultations</h3>
            <p className="text-sm text-gray-600 mt-1">Next scheduled meetings with clients</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/consultations')}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <DataTable
          data={upcomingConsultations}
          columns={consultationColumns}
          onRowClick={(consultation) => navigate(`/consultations/${consultation.id}`)}
        />
      </div>

      {/* Recent Clients */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Clients</h3>
            <p className="text-sm text-gray-600 mt-1">Recently active client matters</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <DataTable
          data={recentClients}
          columns={clientColumns}
          onRowClick={(client) => navigate(`/clients/${client.id}`)}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start" onClick={() => navigate('/consultations/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Consultation
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/clients/new')}>
            <Users className="h-4 w-4 mr-2" />
            Add Client
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/messages')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>
    </div>
  );
};
