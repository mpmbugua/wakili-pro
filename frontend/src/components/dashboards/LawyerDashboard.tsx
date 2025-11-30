import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MessageSquare, FileText, Video, Clock, Plus, ArrowRight,
  Users, DollarSign, TrendingUp, CheckCircle, AlertCircle, BarChart3, User,
  Crown, Shield, Zap, Award, X, Lock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader, StatCard, DataTable, Column } from '../ui';
import { TierLimitModal, CertificationBlockedModal, CommissionSavingsModal } from '../modals';
import type { AuthUser } from '@wakili-pro/shared/src/types/auth';

interface LawyerDashboardProps {
  user: AuthUser;
}

interface TierUsage {
  currentTier: 'FREE' | 'LITE' | 'PRO';
  usage: {
    bookings: { current: number; limit: number; percentage: number };
    certifications: { current: number; limit: number; percentage: number };
    services: { current: number; limit: number; percentage: number };
    specializations: { current: number; limit: number };
  };
  commissionRate: number;
  pricingTier: 'ENTRY' | 'STANDARD' | 'PREMIUM' | 'ELITE';
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
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkVerificationStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      setIsVerified(data.data?.lawyerProfile?.isVerified || false);
    } catch (error) {
      console.error('Failed to check verification status:', error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    // Check lawyer verification status
    checkVerificationStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show pending verification message for unverified lawyers
  if (!isVerified) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Pending</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Thank you for submitting your lawyer profile! Our admin team is currently reviewing your credentials.
            You'll receive an email notification once your profile is approved (usually within 24-48 hours).
          </p>
          <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Admin reviews your license number and credentials</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Verification typically completed within 24-48 hours</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>You'll receive an email when approved</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Once approved, you can start accepting clients</span>
              </li>
            </ul>
          </div>
          <button
            onClick={checkVerificationStatus}
            disabled={checking}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {checking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking Status...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Refresh Verification Status
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Original dashboard for verified lawyers
  
  const [stats, setStats] = useState({
    activeClients: 0,
    consultationsThisMonth: 0,
    revenue: 0,
    completionRate: 0,
    pendingConsultations: 0,
    totalDocuments: 0,
  });

  // Tier usage state (fetched from lawyer profile)
  const [tierUsage, setTierUsage] = useState<TierUsage>({
    currentTier: 'FREE',
    usage: {
      bookings: { current: 0, limit: 2, percentage: 0 },
      certifications: { current: 0, limit: 0, percentage: 0 },
      services: { current: 0, limit: 1, percentage: 0 },
      specializations: { current: 0, limit: 2 },
    },
    commissionRate: 0.50,
    pricingTier: 'ENTRY',
  });

  // Modal states
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<'bookings' | 'certifications' | 'services'>('bookings');
  const [showCertModal, setShowCertModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  // Fetch real lawyer data on mount
  useEffect(() => {
    const fetchLawyerData = async () => {
      try {
        const response = await fetch('/api/lawyers/profile', {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('wakili-auth-storage') ? JSON.parse(localStorage.getItem('wakili-auth-storage')!).state?.accessToken : ''}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
          // Update tier usage based on actual lawyer profile
          const profile = data.data;
          const tier = profile.tier || 'FREE';
          const specializationsCount = profile.specializations?.length || 0;
          
          // Set tier limits based on actual tier
          const tierLimits = {
            FREE: { bookings: 2, certifications: 0, services: 1, specializations: 2, commission: 0.50 },
            LITE: { bookings: 10, certifications: 5, services: 5, specializations: 3, commission: 0.30 },
            PRO: { bookings: 999, certifications: 999, services: 999, specializations: 10, commission: 0.15 }
          };
          
          const limits = tierLimits[tier as keyof typeof tierLimits] || tierLimits.FREE;
          
          setTierUsage({
            currentTier: tier as 'FREE' | 'LITE' | 'PRO',
            usage: {
              bookings: { current: 0, limit: limits.bookings, percentage: 0 },
              certifications: { current: 0, limit: limits.certifications, percentage: 0 },
              services: { current: 0, limit: limits.services, percentage: 0 },
              specializations: { current: specializationsCount, limit: limits.specializations },
            },
            commissionRate: limits.commission,
            pricingTier: tier === 'FREE' ? 'ENTRY' : tier === 'LITE' ? 'STANDARD' : 'PREMIUM',
          });
        }
      } catch (error) {
        console.error('Failed to fetch lawyer data:', error);
      }
    };

    fetchLawyerData();
  }, []);

  const handleUpgrade = () => {
    navigate('/subscriptions');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE': return 'text-gray-600 bg-gray-100';
      case 'LITE': return 'text-blue-600 bg-blue-100';
      case 'PRO': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PRO': return Crown;
      case 'LITE': return Shield;
      default: return null;
    }
  };

  const shouldShowUpgradeBanner = () => {
    const { bookings, certifications, services } = tierUsage.usage;
    return (
      bookings.percentage >= 75 ||
      certifications.percentage >= 75 ||
      services.percentage >= 75 ||
      (tierUsage.currentTier === 'FREE' && stats.revenue > 20000)
    );
  };

  const calculateCommissionPaid = () => {
    return stats.revenue * tierUsage.commissionRate;
  };

  const TierIcon = getTierIcon(tierUsage.currentTier);

  // Real data arrays - will be populated from API calls
  const upcomingConsultations: Consultation[] = [];
  const recentClients: Client[] = [];

  const performanceData = {
    thisMonth: { consultations: stats.consultationsThisMonth, revenue: stats.revenue },
    lastMonth: { consultations: 0, revenue: 0 },
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
      {/* Tier Limit Modal */}
      <TierLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType={limitModalType}
        currentTier={tierUsage.currentTier}
        currentUsage={tierUsage.usage[limitModalType].current}
        limit={tierUsage.usage[limitModalType].limit}
        onUpgrade={handleUpgrade}
      />

      {/* Certification Blocked Modal */}
      <CertificationBlockedModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        onUpgrade={handleUpgrade}
      />

      {/* Commission Savings Modal */}
      <CommissionSavingsModal
        isOpen={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        currentTier={tierUsage.currentTier}
        monthlyRevenue={stats.revenue}
        onUpgrade={handleUpgrade}
      />

      {/* Page Header with Tier Badge */}
      <PageHeader
        title={
          <div className="flex items-center space-x-3">
            <span>Welcome back, Advocate {user.firstName}!</span>
            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(tierUsage.currentTier)}`}>
              {TierIcon && <TierIcon className="h-4 w-4" />}
              <span>{tierUsage.currentTier} TIER</span>
            </div>
          </div>
        }
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
            {tierUsage.currentTier !== 'PRO' && (
              <Button 
                variant="primary" 
                onClick={() => navigate('/subscriptions')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </>
        }
      />

      {/* Upgrade Banner - Show if usage is high or commission savings available */}
      {shouldShowUpgradeBanner() && tierUsage.currentTier !== 'PRO' && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-6 w-6" />
                <h3 className="text-xl font-bold">
                  {tierUsage.usage.bookings.percentage >= 75
                    ? 'Booking Limit Alert!'
                    : `You've paid KES ${calculateCommissionPaid().toLocaleString()} in commissions this month`}
                </h3>
              </div>
              <p className="text-emerald-100 mb-4">
                {tierUsage.currentTier === 'FREE'
                  ? `Upgrade to LITE and save 20% on commissions. That's KES ${(calculateCommissionPaid() * 0.20).toLocaleString()} back in your pocket!`
                  : `Upgrade to PRO for lower commissions and unlimited access. Save up to KES ${(calculateCommissionPaid() * 0.15).toLocaleString()}/month!`}
              </p>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  className="bg-white text-emerald-600 hover:bg-emerald-50 border-0"
                  onClick={() => setShowSavingsModal(true)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Calculate Savings
                </Button>
                <Button 
                  variant="outline"
                  className="bg-emerald-700 text-white hover:bg-emerald-800 border-0"
                  onClick={() => navigate('/subscriptions')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </div>
            <button
              onClick={() => {/* Dismiss banner */}}
              className="text-emerald-100 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Usage Meters - Show current tier limits */}
      {tierUsage.currentTier !== 'PRO' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Usage</h3>
            <button
              onClick={() => navigate('/subscriptions')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Limits →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bookings Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Bookings</span>
                <span className="text-sm font-semibold text-gray-900">
                  {tierUsage.usage.bookings.current}/{tierUsage.usage.bookings.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    tierUsage.usage.bookings.percentage >= 100
                      ? 'bg-red-600'
                      : tierUsage.usage.bookings.percentage >= 75
                      ? 'bg-amber-600'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(tierUsage.usage.bookings.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Certifications Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Certifications</span>
                <span className="text-sm font-semibold text-gray-900">
                  {tierUsage.usage.certifications.current}/{tierUsage.usage.certifications.limit === 0 ? '∞' : tierUsage.usage.certifications.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                {tierUsage.usage.certifications.limit === 0 ? (
                  <div className="h-2 rounded-full bg-gray-300 flex items-center justify-center">
                    <Lock className="h-3 w-3 text-gray-500" />
                  </div>
                ) : (
                  <div
                    className={`h-2 rounded-full transition-all ${
                      tierUsage.usage.certifications.percentage >= 100
                        ? 'bg-red-600'
                        : tierUsage.usage.certifications.percentage >= 75
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(tierUsage.usage.certifications.percentage, 100)}%` }}
                  />
                )}
              </div>
            </div>

            {/* Services Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Services</span>
                <span className="text-sm font-semibold text-gray-900">
                  {tierUsage.usage.services.current}/{tierUsage.usage.services.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    tierUsage.usage.services.percentage >= 100
                      ? 'bg-red-600'
                      : tierUsage.usage.services.percentage >= 75
                      ? 'bg-amber-600'
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${Math.min(tierUsage.usage.services.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
