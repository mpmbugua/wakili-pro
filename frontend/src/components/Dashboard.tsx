import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { GuestDashboard } from './dashboards/GuestDashboard';
import { PublicDashboard } from './dashboards/PublicDashboard';
import { LawyerDashboard } from './dashboards/LawyerDashboard';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { SuperAdminDashboard } from './dashboards/SuperAdminDashboard';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, MessageSquare, FileText, BarChart3, Video, Clock,
  TrendingUp, Users, DollarSign, CheckCircle, AlertCircle, Plus
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import chatService from '../services/chatService';
import { PageHeader, StatCard, DataTable, Column, EmptyState } from './ui';
import { Button } from './ui/Button';

interface Consultation {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  type: string;
}

interface Activity {
  id: string;
  action: string;
  timestamp: string;
  user: string;
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Initialize all hooks at the top (before any conditional returns)
  const [loading, setLoading] = useState(true);
  const hasFetchedData = React.useRef(false);
  const [stats, setStats] = useState({
    consultations: 0,
    messages: 0,
    documents: 0,
    revenue: 0,
    clients: 0,
    completionRate: 0,
  });
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Consultation[]>([]);
  const [performanceData, setPerformanceData] = useState({
    thisWeek: { consultations: 12, revenue: 45000 },
    lastWeek: { consultations: 10, revenue: 38000 },
  });

  useEffect(() => {
    // Only fetch once
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats - use mock data to avoid API call loops
        const consultations = 8;
        const messages = 5;
        const revenue = user?.role === 'LAWYER' ? 125000 : 0;
        
        setStats({
          consultations,
          messages,
          documents: 12, // Mock data
          revenue,
          clients: 24, // Mock data
          completionRate: 94, // Mock data
        });
        
        // Mock recent consultations
        setRecentConsultations([
          { id: '1', clientName: 'John Kamau', date: '2024-01-15', time: '10:00 AM', status: 'upcoming', type: 'Legal Advice' },
          { id: '2', clientName: 'Mary Wanjiku', date: '2024-01-14', time: '2:00 PM', status: 'completed', type: 'Contract Review' },
          { id: '3', clientName: 'Peter Ochieng', date: '2024-01-13', time: '11:30 AM', status: 'completed', type: 'Court Representation' },
        ]);
        
        // Mock recent activity
        setRecentActivity([
          { id: '1', action: 'New consultation request from John Kamau', timestamp: '2 hours ago', user: 'John Kamau' },
          { id: '2', action: 'Document uploaded: Contract Draft', timestamp: '5 hours ago', user: 'Mary Wanjiku' },
          { id: '3', action: 'Payment received: KES 15,000', timestamp: '1 day ago', user: 'Peter Ochieng' },
        ]);
        
        // Mock upcoming appointments
        setUpcomingAppointments([
          { id: '1', clientName: 'John Kamau', date: '2024-01-15', time: '10:00 AM', status: 'upcoming', type: 'Legal Advice' },
          { id: '4', clientName: 'Sarah Njeri', date: '2024-01-15', time: '2:30 PM', status: 'upcoming', type: 'Contract Review' },
          { id: '5', clientName: 'David Otieno', date: '2024-01-16', time: '11:00 AM', status: 'upcoming', type: 'Consultation' },
        ]);
        
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user?.role]); // Add user.role dependency

  // Route to appropriate dashboard based on user role (after all hooks)
  if (!user) {
    return <GuestDashboard />;
  }

  if (user.role === 'PUBLIC') {
    return <PublicDashboard user={user} />;
  }

  if (user.role === 'LAWYER') {
    return <LawyerDashboard user={user} />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} />;
  }

  if (user.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard user={user} />;
  }

  // Table columns
  const consultationColumns: Column<Consultation>[] = [
    {
      key: 'clientName',
      label: 'Client',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'time',
      label: 'Time',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        subtitle={user?.role === 'LAWYER' ? 'Lawyer Dashboard' : 'Client Dashboard'}
        description={
          user?.role === 'LAWYER' 
            ? 'Manage your legal practice, consultations, and client relationships'
            : 'Access legal services, track your consultations, and manage documents'
        }
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/consultations')}>
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
          title="Consultations"
          value={stats.consultations}
          change="+12%"
          trend="up"
          icon={Video}
          iconColor="text-blue-600"
          description="Active this month"
          className="hover:shadow-lg transition-all duration-200"
        />
        <StatCard
          title="Messages"
          value={stats.messages}
          change="+5"
          trend="up"
          icon={MessageSquare}
          iconColor="text-emerald-600"
          description="Unread messages"
          className="hover:shadow-lg transition-all duration-200"
        />
        <StatCard
          title="Documents"
          value={stats.documents}
          change="3"
          trend="neutral"
          icon={FileText}
          iconColor="text-violet-600"
          description="Pending review"
          className="hover:shadow-lg transition-all duration-200"
        />
        {user?.role === 'LAWYER' ? (
          <StatCard
            title="Revenue"
            value={`KES ${stats.revenue.toLocaleString()}`}
            change="+18%"
            trend="up"
            icon={DollarSign}
            iconColor="text-amber-600"
            description="This month"
            className="hover:shadow-lg transition-all duration-200"
          />
        ) : (
          <StatCard
            title="Quick Actions"
            value="4"
            icon={TrendingUp}
            iconColor="text-indigo-600"
            description="Available services"
            className="hover:shadow-lg transition-all duration-200"
          />
        )}
      </div>

      {/* Additional Stats for Lawyers */}
      {user?.role === 'LAWYER' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Total Clients"
            value={stats.clients}
            icon={Users}
            iconColor="text-indigo-600"
            className="hover:shadow-lg transition-all duration-200"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            change="+2%"
            trend="up"
            icon={CheckCircle}
            iconColor="text-emerald-600"
            className="hover:shadow-lg transition-all duration-200"
          />
          <StatCard
            title="Avg. Response Time"
            value="2.5 hrs"
            change="-15%"
            trend="up"
            icon={Clock}
            iconColor="text-cyan-600"
            className="hover:shadow-lg transition-all duration-200"
          />
        </div>
      )}

      {/* Performance Overview & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Performance This Week */}
        {user?.role === 'LAWYER' && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">This Week's Performance</h2>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Consultations Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{performanceData.thisWeek.consultations}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                    <TrendingUp className="h-3 w-3" />
                    +{performanceData.lastWeek.consultations > 0 ? ((performanceData.thisWeek.consultations - performanceData.lastWeek.consultations) / performanceData.lastWeek.consultations * 100).toFixed(0) : '0'}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Revenue Generated</p>
                  <p className="text-2xl font-bold text-slate-900">KES {performanceData.thisWeek.revenue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                    <TrendingUp className="h-3 w-3" />
                    +{performanceData.lastWeek.revenue > 0 ? ((performanceData.thisWeek.revenue - performanceData.lastWeek.revenue) / performanceData.lastWeek.revenue * 100).toFixed(0) : '0'}%
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <p className="text-xs text-slate-600">Compared to last week: {performanceData.lastWeek.consultations} consultations, KES {performanceData.lastWeek.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h2>
            <Link to="/consultations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/consultations/${appointment.id}`)}
                >
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{appointment.clientName}</p>
                    <p className="text-xs text-slate-600">{appointment.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-900">{appointment.time}</p>
                    <p className="text-xs text-slate-600">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600">No upcoming appointments</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Consultations */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 bg-slate-50 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Consultations</h2>
              <Link to="/consultations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all
              </Link>
            </div>
            <div className="p-6 pt-4">
            {recentConsultations.length > 0 ? (
              <DataTable
                data={recentConsultations}
                columns={consultationColumns}
                searchable={false}
                onRowClick={(item) => navigate(`/consultations/${item.id}`)}
              />
            ) : (
              <EmptyState
                icon={Calendar}
                title="No consultations yet"
                description="Your recent consultations will appear here once you schedule or complete them."
                action={{
                  label: 'Schedule Consultation',
                  onClick: () => navigate('/consultations/new'),
                }}
              />
            )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="p-6 pb-4 bg-slate-50 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            </div>
            <div className="p-6 pt-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-blue-100' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 leading-relaxed">{activity.action}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="No activity"
                description="Recent activity will appear here."
              />
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-6 pb-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <p className="text-sm text-slate-600 mt-1">Access key features and services</p>
        </div>
        <div className="p-6 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/ai"
            className="group flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">AI Assistant</h3>
              <p className="text-xs text-slate-600">Get legal guidance</p>
            </div>
          </Link>
          
          <Link
            to="/lawyers"
            className="group flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all duration-200"
          >
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Find Lawyers</h3>
              <p className="text-xs text-slate-600">Browse legal experts</p>
            </div>
          </Link>
          
          <Link
            to="/marketplace"
            className="group flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-violet-300 hover:shadow-md transition-all duration-200"
          >
            <div className="p-2 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">Documents</h3>
              <p className="text-xs text-slate-600">Legal templates</p>
            </div>
          </Link>
          
          <Link
            to="/resources"
            className="group flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all duration-200"
          >
            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">Resources</h3>
              <p className="text-xs text-slate-600">Legal information</p>
            </div>
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
