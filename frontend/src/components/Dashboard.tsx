import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { User, Scale, Shield, Calendar, MessageSquare, FileText, BarChart3, LogOut, Settings, BookOpen } from 'lucide-react';
import { VideoConsultationDashboard } from './VideoConsultationDashboard';
import { analyticsService } from '../services/analyticsService';
import chatService from '../services/chatService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    appointments: number;
    messages: number;
    documents: number;
    analytics: number;
  }>({ appointments: 0, messages: 0, documents: 0, analytics: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        // Appointments: count of upcoming video consultations
        // Messages: unread chat messages
        // Documents: recent files (simulate as 0 for now)
        // Analytics: revenue this month (for lawyers)
        let appointments = 0;
        let messages = 0;
        let documents = 0;
        let analytics = 0;
        try {
          const upcoming = await import('../services/videoConsultationService').then(m => m.videoConsultationService.getUpcomingConsultations());
          appointments = upcoming.length;
        } catch {
          // Ignore errors: appointments fallback to 0
        }
        try {
          const chatRooms = await chatService.getChatRooms();
          messages = chatRooms.data?.reduce((acc, room) => acc + (room.unreadCount || 0), 0) || 0;
        } catch {
          // Ignore errors: messages fallback to 0
        }
        // Documents: not implemented, set to 0
        try {
          if (user?.role === 'LAWYER') {
            const analyticsRes = await analyticsService.getDashboardAnalytics({});
            analytics = analyticsRes.data?.monthlyRevenue?.[analyticsRes.data.monthlyRevenue.length - 1]?.revenue || 0;
          }
        } catch {
          // Ignore errors: analytics fallback to 0
        }
        setStats({ appointments, messages, documents, analytics });
      } catch (err) {
        setError('Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Navigation Header */}
      <header className="navbar sticky top-0 z-50 bg-white shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-display font-bold text-primary">
              Wakili Pro
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/ai" className="text-slate-700 hover:text-primary transition-colors">AI Assistant</Link>
              <Link to="/lawyers" className="text-slate-700 hover:text-primary transition-colors">Find Lawyers</Link>
              <Link to="/marketplace" className="text-slate-700 hover:text-primary transition-colors">Documents</Link>
              <Link to="/services" className="text-slate-700 hover:text-primary transition-colors">Services</Link>
              <Link to="/resources" className="text-slate-700 hover:text-primary transition-colors">Resources</Link>
              <Link to="/dashboard" className="text-primary font-semibold transition-colors">Dashboard</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/settings')}
                className="text-slate-600 hover:text-primary transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="btn-outline inline-flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8" aria-label="User Dashboard">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-8 text-red-600">
            <span>{error}</span>
            <Button variant="outline" size="sm" className="ml-4" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {user.role === 'LAWYER' ? (
              <Scale className="h-12 w-12 text-white" />
            ) : user.role === 'ADMIN' ? (
              <Shield className="h-12 w-12 text-white" />
            ) : (
              <User className="h-12 w-12 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-blue-100 mt-1">
              {user.role === 'LAWYER' ? 'Manage your legal practice' : 
               user.role === 'ADMIN' ? 'System administration dashboard' : 
               'Access legal services and consultations'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Quick Actions">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" aria-label="Appointments">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              <span>Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
      <p className="text-2xl font-bold text-gray-900">{stats.appointments}</p>
      <p className="text-sm text-gray-600">Upcoming</p>
    </CardContent>
  </Card>

  <Card className="hover:shadow-lg transition-shadow cursor-pointer" aria-label="Messages">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span>Messages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats.messages}</p>
            <p className="text-sm text-gray-600">Unread messages</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" aria-label="Documents">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
            <p className="text-sm text-gray-600">Recent files</p>
          </CardContent>
        </Card>

        {user.role === 'LAWYER' && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" aria-label="Analytics">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                <span>Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">KES {stats.analytics.toLocaleString()}</p>
              <p className="text-sm text-gray-600">This month</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Profile Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Your account details and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Name:</dt>
              <dd className="text-sm text-gray-900">{user.firstName} {user.lastName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Email:</dt>
              <dd className="text-sm text-gray-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Role:</dt>
              <dd className="text-sm text-gray-900">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'LAWYER' 
                    ? 'bg-sky-100 text-sky-800' 
                    : user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role === 'LAWYER' ? 'Legal Practitioner' : 
                   user.role === 'ADMIN' ? 'Administrator' : 'General Public'}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Status:</dt>
              <dd className="text-sm text-gray-900">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  user.verificationStatus === 'VERIFIED' 
                    ? 'bg-green-100 text-green-800' 
                    : user.verificationStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.verificationStatus}
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Video Consultations */}
      <Card>
        <CardHeader>
          <CardTitle>Video Consultations</CardTitle>
          <CardDescription>
            Manage your legal consultations and video calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoConsultationDashboard />
        </CardContent>
      </Card>

      {/* Admin Access */}
      {user.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>System Administration</span>
            </CardTitle>
            <CardDescription>
              Administrative tools and system management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link 
                to="/admin/dashboard" 
                className="group p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="text-white">
                  <Shield className="h-8 w-8 mb-3" />
                  <h4 className="font-semibold text-lg mb-2">Admin Dashboard</h4>
                  <p className="text-purple-100 text-sm">
                    System overview and key metrics
                  </p>
                </div>
              </Link>
              
              <Link 
                to="/admin/users" 
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-sky-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <User className="h-8 w-8 text-sky-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">User Management</h4>
                <p className="text-gray-600 text-sm">
                  Manage registered users
                </p>
              </Link>
              
              <Link 
                to="/admin/lawyers" 
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-300 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Scale className="h-8 w-8 text-amber-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Lawyer Verification</h4>
                <p className="text-gray-600 text-sm">
                  Review lawyer applications
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lawyer Onboarding */}
      {user.role === 'LAWYER' && user.verificationStatus !== 'VERIFIED' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Complete Your Profile</CardTitle>
            <CardDescription className="text-amber-700">
              Finish setting up your lawyer profile to start accepting clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/lawyer/onboarding">
              <Button>Complete Onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}