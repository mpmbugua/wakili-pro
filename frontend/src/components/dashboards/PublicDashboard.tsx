import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, FileText, Video, Clock, Plus, ArrowRight, Scale, FileCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader, StatCard } from '../ui';
import type { AuthUser } from '@wakili-pro/shared/src/types/auth';
import { axiosInstance } from '../../lib/axios';

interface PublicDashboardProps {
  user: AuthUser;
}

interface Consultation {
  id: string;
  serviceType: string;
  status: string;
  scheduledAt: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const PublicDashboard: React.FC<PublicDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeConsultations: 0,
    scheduledMeetings: 0,
    documents: 0,
    messages: 0,
  });

  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch consultations
        const response = await axiosInstance.get('/consultations/my-consultations');
        if (response.data.success) {
          const consultations = response.data.data as Consultation[];
          
          // Filter active consultations (confirmed or in progress)
          const active = consultations.filter(c => 
            c.status === 'CONFIRMED' || c.status === 'IN_PROGRESS'
          );
          
          // Filter upcoming consultations (scheduled in the future)
          const now = new Date();
          const upcoming = consultations
            .filter(c => 
              c.status === 'CONFIRMED' && 
              new Date(c.scheduledAt) > now
            )
            .slice(0, 3); // Only show top 3
          
          setStats(prev => ({
            ...prev,
            activeConsultations: active.length,
            scheduledMeetings: upcoming.length,
          }));
          
          setUpcomingConsultations(upcoming);
          
          // Build recent activity from consultations
          const recentItems = consultations
            .slice(0, 3)
            .map(c => ({
              id: c.id,
              action: `Consultation ${c.status.toLowerCase()} with ${c.provider.firstName} ${c.provider.lastName}`,
              timestamp: formatTimestamp(c.scheduledAt),
            }));
          
          setRecentActivity(recentItems);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const formatConsultationDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { date: dateStr, time: timeStr };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user.firstName}!`}
        subtitle="Client Dashboard"
        description="Manage your legal consultations, documents, and communications"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/lawyers')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Find a Lawyer
            </Button>
          </>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Active Consultations"
          value={stats.activeConsultations}
          icon={Video}
          iconColor="text-blue-600"
          description="In progress"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/consultations')}
        />
        <StatCard
          title="Scheduled Meetings"
          value={stats.scheduledMeetings}
          icon={Calendar}
          iconColor="text-emerald-600"
          description="Upcoming"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/consultations')}
        />
        <StatCard
          title="Documents"
          value={stats.documents}
          icon={FileText}
          iconColor="text-purple-600"
          description="Total files"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/documents')}
        />
        <StatCard
          title="Messages"
          value={stats.messages}
          icon={MessageSquare}
          iconColor="text-amber-600"
          description="Unread"
          className="hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/messages')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Consultations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Consultations</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/consultations')}>
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingConsultations.length > 0 ? (
              upcomingConsultations.map((consultation) => {
                const { date, time } = formatConsultationDate(consultation.scheduledAt);
                return (
                  <div
                    key={consultation.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/consultations/${consultation.id}`)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {consultation.provider.firstName} {consultation.provider.lastName}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">{consultation.serviceType}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <p className="text-gray-500 text-xs">
                          {date} at {time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-medium mb-1">No consultations yet</p>
                <p className="text-gray-500 text-sm mb-4">Start by finding a lawyer</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/lawyers')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Browse Lawyers
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm">{activity.action}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-medium mb-1">No activity yet</p>
                <p className="text-gray-500 text-sm">Your recent consultations will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start" onClick={() => navigate('/lawyers')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Find a Lawyer
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/ai')}>
            <Video className="h-4 w-4 mr-2" />
            AI Legal Assistant
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/services')}>
            <Scale className="h-4 w-4 mr-2" />
            Legal Services
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/documents/services')}>
            <FileCheck className="h-4 w-4 mr-2" />
            Document Review
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/marketplace')}>
            <FileText className="h-4 w-4 mr-2" />
            Browse Documents
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => navigate('/resources')}>
            <Calendar className="h-4 w-4 mr-2" />
            Legal Resources
          </Button>
        </div>
      </div>
    </div>
  );
};
