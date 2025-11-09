import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate, Link } from 'react-router-dom';
import { User, Scale, Shield, Calendar, MessageSquare, FileText, BarChart3 } from 'lucide-react';
import { VideoConsultationDashboard } from './VideoConsultationDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              <span>Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-600">Upcoming today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span>Messages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-600">Unread messages</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">48</p>
            <p className="text-sm text-gray-600">Recent files</p>
          </CardContent>
        </Card>

        {user.role === 'LAWYER' && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                <span>Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">$12.4k</p>
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
  );
};

export default Dashboard;