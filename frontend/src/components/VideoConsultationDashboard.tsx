import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Play,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { videoConsultationService, VideoConsultation } from '../services/videoConsultationService';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

export const VideoConsultationDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeConsultations, setActiveConsultations] = useState<VideoConsultation[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<VideoConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [active, upcoming] = await Promise.all([
        videoConsultationService.getActiveConsultations(),
        videoConsultationService.getUpcomingConsultations()
      ]);
      
      setActiveConsultations(active);
      setUpcomingConsultations(upcoming);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load video consultations');
      console.error('Failed to load consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'text-green-600 bg-green-100';
      case 'WAITING_FOR_PARTICIPANTS':
        return 'text-yellow-600 bg-yellow-100';
      case 'SCHEDULED':
        return 'text-blue-600 bg-blue-100';
      case 'COMPLETED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Video className="w-4 h-4" />;
      case 'WAITING_FOR_PARTICIPANTS':
        return <Users className="w-4 h-4" />;
      case 'SCHEDULED':
        return <Calendar className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading video consultations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" />
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadConsultations}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Consultations */}
      {activeConsultations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2 text-green-600" />
              Active Video Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {getStatusIcon(consultation.status)}
                        <span className="ml-1">{consultation.status.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="ml-4 text-sm text-gray-600">
                        {consultation.participantCount} participant{consultation.participantCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-900">
                      {consultation.booking.service.title}
                    </h4>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {consultation.startedAt ? (
                        <>Started: {formatTime(consultation.startedAt)}</>
                      ) : (
                        <>Scheduled: {formatTime(consultation.scheduledAt)}</>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      {user?.role === 'LAWYER' ? (
                        <>Client: {consultation.client.firstName} {consultation.client.lastName}</>
                      ) : (
                        <>Lawyer: {consultation.lawyer.firstName} {consultation.lawyer.lastName}</>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link to={`/consultation/${consultation.id}/video`}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-1" />
                        Join Call
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Consultations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Upcoming Video Consultations
            </div>
            {user?.role === 'LAWYER' && (
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Schedule New
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingConsultations.length > 0 ? (
            <div className="space-y-4">
              {upcomingConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {getStatusIcon(consultation.status)}
                        <span className="ml-1">{consultation.status.replace(/_/g, ' ')}</span>
                      </span>
                      
                      {consultation.isRecorded && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                          Recording
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-900">
                      {consultation.booking.service.title}
                    </h4>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      Scheduled: {formatTime(consultation.scheduledAt)}
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      {user?.role === 'LAWYER' ? (
                        <>Client: {consultation.client.firstName} {consultation.client.lastName}</>
                      ) : (
                        <>Lawyer: {consultation.lawyer.firstName} {consultation.lawyer.lastName}</>
                      )}
                    </div>

                    {consultation.meetingNotes && (
                      <div className="text-sm text-gray-600 mt-2 italic">
                        Notes: {consultation.meetingNotes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link to={`/consultation/${consultation.id}/video`}>
                      <Button variant="outline">
                        <Video className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Consultations</h3>
              <p className="text-gray-600 mb-4">
                {user?.role === 'LAWYER' 
                  ? 'Schedule video consultations with your clients.' 
                  : 'Book a consultation with a lawyer to get started.'}
              </p>
              {user?.role === 'PUBLIC' && (
                <Link to="/marketplace">
                  <Button>
                    Browse Lawyers
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Video className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-gray-900">{activeConsultations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingConsultations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeConsultations.length + upcomingConsultations.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};