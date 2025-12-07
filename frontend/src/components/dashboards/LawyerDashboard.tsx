import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MessageSquare, FileText, Video, Clock, Plus, ArrowRight,
  Users, DollarSign, TrendingUp, CheckCircle, AlertCircle, BarChart3, User,
  Crown, Shield, Zap, Award, X, Lock, Briefcase, Wallet, ArrowDownCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader, StatCard, DataTable, Column } from '../ui';
import { TierLimitModal, CertificationBlockedModal, CommissionSavingsModal, UpgradeModal } from '../modals';
import { LawyerArticlesSection } from './LawyerArticlesSection';
import type { AuthUser } from '@wakili-pro/shared/src/types/auth';
import axiosInstance from '../../lib/axios';
import { walletService } from '../../services/walletService';

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

interface Article {
  id: string;
  title: string;
  category?: string;
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    category?: string;
    tags?: string[];
  };
}

export const LawyerDashboard: React.FC<LawyerDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // All useState hooks must be at the top before any returns
  const [stats, setStats] = useState({
    activeClients: 0,
    consultationsThisMonth: 0,
    revenue: 0,
    completionRate: 0,
    pendingConsultations: 0,
    totalDocuments: 0,
  });

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState({
    balance: 0,
    pendingBalance: 0,
    availableBalance: 0,
    loading: true,
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const checkVerificationStatus = async () => {
    try {
      setChecking(true);
      console.log('[LawyerDashboard] Checking verification status...');
      const response = await axiosInstance.get('/users/profile');
      console.log('[LawyerDashboard] Full API response:', JSON.stringify(response.data, null, 2));
      
      const profileData = response.data?.data;
      const lawyerProfile = profileData?.lawyerProfile;
      
      console.log('[LawyerDashboard] Lawyer profile:', lawyerProfile);
      console.log('[LawyerDashboard] lawyerProfile.isVerified:', lawyerProfile?.isVerified);
      console.log('[LawyerDashboard] User verificationStatus:', profileData?.verificationStatus);
      
      // Check if lawyer profile exists
      const profileExists = !!lawyerProfile;
      setHasProfile(profileExists);
      
      // Check verification status - accept both isVerified and verificationStatus
      const verified = lawyerProfile?.isVerified === true || 
                      profileData?.verificationStatus === 'VERIFIED' ||
                      profileData?.verificationStatus === 'APPROVED';
      
      console.log('[LawyerDashboard] Profile exists:', profileExists);
      console.log('[LawyerDashboard] Final verified status:', verified);
      setIsVerified(verified);
    } catch (error) {
      console.error('[LawyerDashboard] Failed to check verification status:', error);
      // On error, assume profile exists and is verified to avoid blocking UI
      // This is temporary - you can change this behavior
      setHasProfile(true);
      setIsVerified(true);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    // Check lawyer verification status
    checkVerificationStatus();
  }, []);

  // Fetch lawyer's articles
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setArticlesLoading(true);
        const response = await axiosInstance.get('/articles', {
          params: { authorId: user.id }
        });
        if (response.data.success && response.data.data) {
          // If pagination is used, extract articles array
          const articlesData = response.data.data.articles || response.data.data;
          setArticles(articlesData);
        }
      } catch (error) {
        console.error('[LawyerDashboard] Failed to fetch articles:', error);
      } finally {
        setArticlesLoading(false);
      }
    };

    if (user.id) {
      fetchArticles();
    }
  }, [user.id]);

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
          // FREE tier: "Platform Sampler" - 2 uses per service to experience all features
          const tierLimits = {
            FREE: { bookings: 2, certifications: 2, services: 2, specializations: 2, commission: 0.50 },
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
            pricingTier: tier === 'FREE' ? 'ENTRY' : tier === 'LITE' ? 'STANDARD' : 'PREMIUM'
          });
        }
      } catch (error) {
        console.error('Failed to fetch lawyer profile:', error);
      }
    };

    const fetchWalletBalance = async () => {
      try {
        const wallet = await walletService.getBalance();
        console.log('Wallet data received:', wallet);
        console.log('Wallet type:', typeof wallet);
        console.log('Wallet keys:', wallet ? Object.keys(wallet) : 'null');
        console.log('Balance value:', wallet?.balance);
        console.log('Balance type:', typeof wallet?.balance);
        
        // Ensure we have valid numbers
        const balance = typeof wallet?.balance === 'number' ? wallet.balance : 0;
        const pendingBalance = typeof wallet?.pendingBalance === 'number' ? wallet.pendingBalance : 0;
        const availableBalance = typeof wallet?.availableBalance === 'number' ? wallet.availableBalance : 0;
        
        console.log('Final values:', { balance, pendingBalance, availableBalance });
        
        setWalletBalance({
          balance,
          pendingBalance,
          availableBalance,
          loading: false,
        });
      } catch (error: any) {
        console.error('Failed to fetch wallet balance:', error);
        // Don't crash on wallet errors - just show zero balance
        // This prevents infinite redirect loops if wallet doesn't exist yet
        if (error.response?.status === 404 || error.response?.status === 401) {
          console.log('Wallet not found or unauthorized - showing zero balance');
        }
        setWalletBalance({
          balance: 0,
          pendingBalance: 0,
          availableBalance: 0,
          loading: false,
        });
      }
    };
    
    if (isVerified) {
      fetchLawyerData();
      fetchWalletBalance();
    } else {
      // Set loading to false if not verified
      setWalletBalance(prev => ({ ...prev, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show pending verification message for unverified lawyers
  if (!isVerified) {
    // No profile exists - show complete profile setup
    if (!hasProfile) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Profile Setup Required</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              To access your lawyer dashboard, please complete your professional profile setup. 
              Once submitted, our admin team will review and verify your credentials within 24-48 hours.
            </p>
            <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Complete your professional profile with license details</span>
                </li>
                <li className="flex items-start">
                  <Clock className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Admin reviews your credentials (24-48 hours)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Email notification when approved</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Start accepting clients and earning</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/lawyer/onboarding')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-3 font-semibold text-lg"
              >
                <User className="h-6 w-6" />
                Complete Profile Setup
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Profile exists but not verified - show pending verification
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Pending</h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Thank you for completing your profile! Our admin team is currently reviewing your credentials. 
            You'll receive an email notification once your profile is verified (typically within 24-48 hours).
          </p>
          <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Profile submitted successfully</span>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Admin review in progress (24-48 hours)</span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Email notification upon approval</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Access to full dashboard features</span>
              </li>
            </ul>
          </div>
          <div className="mt-4">
            <button
              onClick={checkVerificationStatus}
              disabled={checking}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 text-sm"
            >
              {checking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Checking Status...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Refresh Verification Status
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original dashboard for verified lawyers - all hooks already at top
  
  // Rest of component logic below (no more hooks after this point)

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

  const revenueChange = performanceData.lastMonth.revenue > 0 
    ? ((performanceData.thisMonth.revenue - performanceData.lastMonth.revenue) / performanceData.lastMonth.revenue * 100).toFixed(1)
    : '0.0';
  const consultationChange = performanceData.lastMonth.consultations > 0
    ? ((performanceData.thisMonth.consultations - performanceData.lastMonth.consultations) / performanceData.lastMonth.consultations * 100).toFixed(1)
    : '0.0';

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
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Certification Blocked Modal */}
      <CertificationBlockedModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Commission Savings Modal */}
      <CommissionSavingsModal
        isOpen={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        currentTier={tierUsage.currentTier}
        monthlyRevenue={stats.revenue}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={tierUsage.currentTier}
      />

      {/* Page Header with Tier Badge */}
      <PageHeader
        title={
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-semibold tracking-tight">Welcome back, Advocate {user.firstName}!</span>
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
                onClick={() => setShowUpgradeModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                  onClick={() => setShowUpgradeModal(true)}
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

      {/* Platform Experience Tracker - FREE tier shows all services */}
      {tierUsage.currentTier === 'FREE' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Platform Sampler - Experience All Features
              </h3>
              <p className="text-sm text-gray-600 mt-1">Try 2 of each service type to explore Wakili Pro</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Consultations */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Consultations</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  tierUsage.usage.bookings.current >= 2 ? 'bg-red-100 text-red-700' : 
                  tierUsage.usage.bookings.current >= 1 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tierUsage.usage.bookings.current}/2 used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    tierUsage.usage.bookings.current >= 2 ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${(tierUsage.usage.bookings.current / 2) * 100}%` }}
                />
              </div>
              {tierUsage.usage.bookings.current === 0 && (
                <p className="text-xs text-gray-500">✨ Try video/phone consultations</p>
              )}
              {tierUsage.usage.bookings.current === 1 && (
                <p className="text-xs text-amber-600">🔥 1 free consultation left!</p>
              )}
              {tierUsage.usage.bookings.current >= 2 && (
                <p className="text-xs text-red-600">🔒 Upgrade for unlimited consultations</p>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Certifications</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  tierUsage.usage.certifications.current >= 2 ? 'bg-red-100 text-red-700' : 
                  tierUsage.usage.certifications.current >= 1 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tierUsage.usage.certifications.current}/2 used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    tierUsage.usage.certifications.current >= 2 ? 'bg-red-600' : 'bg-purple-600'
                  }`}
                  style={{ width: `${(tierUsage.usage.certifications.current / 2) * 100}%` }}
                />
              </div>
              {tierUsage.usage.certifications.current === 0 && (
                <p className="text-xs text-gray-500">✨ Review & certify documents</p>
              )}
              {tierUsage.usage.certifications.current === 1 && (
                <p className="text-xs text-amber-600">🔥 1 free certification left!</p>
              )}
              {tierUsage.usage.certifications.current >= 2 && (
                <p className="text-xs text-red-600">🔒 Upgrade for unlimited certifications</p>
              )}
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Service Types</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  tierUsage.usage.services.current >= 2 ? 'bg-red-100 text-red-700' : 
                  tierUsage.usage.services.current >= 1 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tierUsage.usage.services.current}/2 used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    tierUsage.usage.services.current >= 2 ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${(tierUsage.usage.services.current / 2) * 100}%` }}
                />
              </div>
              {tierUsage.usage.services.current === 0 && (
                <p className="text-xs text-gray-500">✨ Offer multiple service types</p>
              )}
              {tierUsage.usage.services.current === 1 && (
                <p className="text-xs text-amber-600">🔥 1 free service slot left!</p>
              )}
              {tierUsage.usage.services.current >= 2 && (
                <p className="text-xs text-red-600">🔒 Upgrade for more services</p>
              )}
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Specializations</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  tierUsage.usage.specializations.current >= 2 ? 'bg-red-100 text-red-700' : 
                  tierUsage.usage.specializations.current >= 1 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tierUsage.usage.specializations.current}/2 used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    tierUsage.usage.specializations.current >= 2 ? 'bg-red-600' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${(tierUsage.usage.specializations.current / 2) * 100}%` }}
                />
              </div>
              {tierUsage.usage.specializations.current === 0 && (
                <p className="text-xs text-gray-500">✨ Add your expertise areas</p>
              )}
              {tierUsage.usage.specializations.current === 1 && (
                <p className="text-xs text-amber-600">🔥 1 free specialization left!</p>
              )}
              {tierUsage.usage.specializations.current >= 2 && (
                <p className="text-xs text-red-600">🔒 Upgrade for more specializations</p>
              )}
            </div>
          </div>

          {/* Upgrade CTA */}
          {(tierUsage.usage.bookings.current + tierUsage.usage.certifications.current + 
            tierUsage.usage.services.current + tierUsage.usage.specializations.current) >= 4 && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm mb-1">🎉 You've explored the platform!</p>
                  <p className="text-xs text-blue-100">Upgrade to LITE or PRO for unlimited access to all features</p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage Meters - Show current tier limits for LITE/PRO */}
      {tierUsage.currentTier !== 'PRO' && tierUsage.currentTier !== 'FREE' && (
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

      {/* Performance Overview - All Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Wallet Balance Card */}
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Wallet</h3>
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          {walletBalance.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">KES {walletBalance.availableBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending (Escrow)</p>
                <p className="text-xl font-semibold text-gray-900">KES {walletBalance.pendingBalance.toLocaleString()}</p>
              </div>
              <div className="pt-3 border-t border-emerald-200">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                  onClick={() => navigate('/lawyer/wallet')}
                >
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Consultations Card */}
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Consultations</h3>
            <Video className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.thisMonth.consultations}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{stats.pendingConsultations}</p>
            </div>
            <div className="pt-3 border-t border-emerald-200">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                onClick={() => navigate('/lawyer/consultations')}
              >
                View All
              </Button>
            </div>
          </div>
        </div>

        {/* Documents & Certifications Card */}
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Certifications</p>
              <p className="text-xl font-semibold text-gray-900">{tierUsage.usage.certifications.current} / {tierUsage.usage.certifications.limit}</p>
            </div>
            <div className="pt-3 border-t border-emerald-200">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                onClick={() => navigate('/document-reviews')}
              >
                Manage Files
              </Button>
            </div>
          </div>
        </div>

        {/* Services & Offerings Card */}
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Services</h3>
            <Briefcase className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Active Services</p>
              <p className="text-2xl font-bold text-gray-900">{tierUsage.usage.services.current} / {tierUsage.usage.services.limit}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Clients</p>
              <p className="text-xl font-semibold text-gray-900">{stats.activeClients}</p>
            </div>
            <div className="pt-3 border-t border-emerald-200">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 border-0"
                onClick={() => navigate('/lawyer/service-requests')}
              >
                View Services
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* My Articles Section */}
      <LawyerArticlesSection userId={user.id} />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Button variant="outline" className="justify-start" onClick={() => navigate('/lawyer/wallet')}>
            <Wallet className="h-4 w-4 mr-2" />
            My Wallet
          </Button>
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
