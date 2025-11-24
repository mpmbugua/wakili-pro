import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, FileText, Video, Clock, Plus, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader, StatCard } from '../ui';
import type { AuthUser } from '@wakili-pro/shared/src/types/auth';

interface PublicDashboardProps {
  user: AuthUser;
}

export const PublicDashboard: React.FC<PublicDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [stats] = useState({
    activeConsultations: 2,
    scheduledMeetings: 3,
    documents: 5,
    messages: 7,
  });

  const upcomingConsultations = [
    { id: '1', lawyer: 'Advocate Jane Kamau', date: '2025-11-25', time: '10:00 AM', type: 'Contract Review' },
    { id: '2', lawyer: 'Advocate Peter Ochieng', date: '2025-11-26', time: '2:30 PM', type: 'Legal Consultation' },
    { id: '3', lawyer: 'Advocate Mary Wanjiku', date: '2025-11-27', time: '11:00 AM', type: 'Court Preparation' },
  ];

  const recentActivity = [
    { id: '1', action: 'Document uploaded: Employment Contract', timestamp: '2 hours ago' },
    { id: '2', action: 'Message from Advocate Jane Kamau', timestamp: '5 hours ago' },
    { id: '3', action: 'Consultation completed with Advocate Peter Ochieng', timestamp: '1 day ago' },
  ];

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
            <Button variant="primary" onClick={() => navigate('/ai')}>
              <Plus className="h-4 w-4 mr-2" />
              New Consultation
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
            {upcomingConsultations.map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/consultations/${consultation.id}`)}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{consultation.lawyer}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{consultation.type}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-gray-500 text-xs">
                      {consultation.date} at {consultation.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm">{activity.action}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{activity.timestamp}</p>
                </div>
              </div>
            ))}
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
