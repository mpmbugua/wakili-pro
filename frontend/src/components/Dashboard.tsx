import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
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
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats
        let consultations = 0;
        let messages = 0;
        let revenue = 0;
        let clients = 0;
        
        try {
          const upcoming = await import('../services/videoConsultationService')
            .then(m => m.videoConsultationService.getUpcomingConsultations());
          consultations = upcoming.length;
        } catch {
          // Fallback
        }
        
        try {
          const chatRooms = await chatService.getChatRooms();
          messages = chatRooms.data?.reduce((acc, room) => acc + (room.unreadCount || 0), 0) || 0;
        } catch {
          // Fallback
        }
        
        if (user?.role === 'LAWYER') {
          try {
            const analyticsRes = await analyticsService.getDashboardAnalytics({});
            const monthlyData = analyticsRes.data?.monthlyRevenue || [];
            revenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
          } catch {
            // Fallback
          }
        }
        
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
        
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Consultations"
          value={stats.consultations}
          change="+12%"
          trend="up"
          icon={Video}
          iconColor="text-blue-600"
          description="Active this month"
        />
        <StatCard
          title="Messages"
          value={stats.messages}
          change="+5"
          trend="up"
          icon={MessageSquare}
          iconColor="text-green-600"
          description="Unread messages"
        />
        <StatCard
          title="Documents"
          value={stats.documents}
          change="3"
          trend="neutral"
          icon={FileText}
          iconColor="text-purple-600"
          description="Pending review"
        />
        {user?.role === 'LAWYER' && (
          <StatCard
            title="Revenue"
            value={`KES ${stats.revenue.toLocaleString()}`}
            change="+18%"
            trend="up"
            icon={DollarSign}
            iconColor="text-amber-600"
            description="This month"
          />
        )}
      </div>

      {/* Additional Stats for Lawyers */}
      {user?.role === 'LAWYER' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Clients"
            value={stats.clients}
            icon={Users}
            iconColor="text-indigo-600"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            change="+2%"
            trend="up"
            icon={CheckCircle}
            iconColor="text-green-600"
          />
          <StatCard
            title="Avg. Response Time"
            value="2.5 hrs"
            change="-15%"
            trend="up"
            icon={Clock}
            iconColor="text-blue-600"
          />
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Consultations */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Consultations</h2>
              <Link to="/consultations" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
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

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary-600"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">{activity.action}</p>
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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/ai"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">AI Assistant</h3>
              <p className="text-xs text-slate-600">Get legal guidance</p>
            </div>
          </Link>
          
          <Link
            to="/lawyers"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Find Lawyers</h3>
              <p className="text-xs text-slate-600">Browse legal experts</p>
            </div>
          </Link>
          
          <Link
            to="/marketplace"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Documents</h3>
              <p className="text-xs text-slate-600">Legal templates</p>
            </div>
          </Link>
          
          <Link
            to="/resources"
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="p-2 bg-amber-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Resources</h3>
              <p className="text-xs text-slate-600">Legal information</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}