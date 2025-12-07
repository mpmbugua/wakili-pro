import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEventTracking } from '../hooks/useAnalytics';
import { WakiliLogo } from '../components/ui/WakiliLogo';
import axiosInstance from '../lib/axios';
import {
  MapPin,
  Briefcase,
  Award,
  Star,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Languages,
  Calendar,
  BookOpen,
  Mail,
  Phone,
  Linkedin,
  ArrowLeft
} from 'lucide-react';

interface PublicLawyerData {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  specialty: string;
  specializations: string[];
  location: string;
  locationDetails?: any;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
  hourlyRate: number;
  consultationFee: number;
  bio: string;
  licenseNumber?: string;
  yearOfAdmission?: number;
  isVerified: boolean;
  isAvailable: boolean;
  linkedInProfile?: string;
  tier?: string;
}

export const PublicLawyerProfile: React.FC = () => {
  const { lawyerId } = useParams<{ lawyerId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { trackLawyerView } = useEventTracking();
  const [lawyer, setLawyer] = useState<PublicLawyerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLawyer = async () => {
      try {
        setLoading(true);
        // Fetch specific lawyer by ID
        const response = await axiosInstance.get(`/lawyers/${lawyerId}`);
        
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          setLawyer({
            id: data.id,
            userId: data.user?.id || data.userId,
            name: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
            firstName: data.user?.firstName || '',
            lastName: data.user?.lastName || '',
            email: data.user?.email,
            phoneNumber: data.user?.phoneNumber,
            profileImageUrl: data.profileImageUrl || data.user?.profileImageUrl,
            specialty: data.specializations?.[0] || 'General Practice',
            specializations: data.specializations || [],
            location: data.location || 'Nairobi',
            locationDetails: data.locationDetails,
            rating: data.rating || data.averageRating || 4.5,
            reviewCount: data.reviewCount || data.totalReviews || 0,
            yearsOfExperience: data.yearsOfExperience || 5,
            hourlyRate: data.hourlyRate || data.consultationFee || 3500,
            consultationFee: data.consultationFee || data.hourlyRate || 3500,
            bio: data.bio || 'Experienced legal professional',
            licenseNumber: data.licenseNumber,
            yearOfAdmission: data.yearOfAdmission,
            isVerified: data.isVerified || false,
            isAvailable: data.isAvailable !== false,
            linkedInProfile: data.linkedInProfile,
            tier: data.tier
          });
        } else {
          setError('Lawyer profile not found');
        }
      } catch (err: any) {
        console.error('Error fetching lawyer profile:', err);
        setError('Failed to load lawyer profile');
      } finally {
        setLoading(false);
      }
    };

    if (lawyerId) {
      fetchLawyer();
    }
  }, [lawyerId]);

  // Track lawyer profile view
  useEffect(() => {
    if (lawyer) {
      trackLawyerView(lawyer.userId, lawyer.name);
    }
  }, [lawyer, trackLawyerView]);

  const handleBookConsultation = () => {
    if (!lawyer) return;

    if (!isAuthenticated) {
      sessionStorage.setItem('pendingBooking', JSON.stringify({ 
        lawyerId: lawyer.userId, 
        lawyerName: lawyer.name, 
        hourlyRate: lawyer.consultationFee,
        profileImage: lawyer.profileImageUrl 
      }));
      navigate('/login', { state: { from: `/booking/${lawyer.userId}`, message: 'Please log in to book a consultation' } });
    } else {
      navigate(`/booking/${lawyer.userId}`, { 
        state: { 
          lawyerName: lawyer.name,
          hourlyRate: lawyer.consultationFee,
          specialty: lawyer.specialty,
          profileImage: lawyer.profileImageUrl
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Simple Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/" className="inline-block">
              <WakiliLogo size="md" variant="full" />
            </Link>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading lawyer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Simple Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/" className="inline-block">
              <WakiliLogo size="md" variant="full" />
            </Link>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Lawyer not found'}</p>
            <button
              onClick={() => navigate('/lawyers')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Lawyers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = lawyer.profileImageUrl || 
    `https://ui-avatars.com/api/?name=${lawyer.firstName}+${lawyer.lastName}&background=3b82f6&color=fff&size=400`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-block">
            <WakiliLogo size="md" variant="full" />
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/lawyers')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Lawyers
          </button>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left Column - Profile Card (Fixed, Sticky) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
                {/* Profile Image */}
                <div className="relative h-72">
                <img
                  src={imageUrl}
                  alt={lawyer.name}
                  className="w-full h-full object-cover"
                />
                {lawyer.isVerified && (
                  <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="p-5">
                <h1 className="text-xl font-bold text-slate-900 mb-1">{lawyer.name}</h1>
                <p className="text-blue-600 font-medium mb-3 text-sm">{lawyer.specialty}</p>

                {/* Rating */}
                <div className="flex items-center mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-base font-bold">{lawyer.rating ? lawyer.rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <span className="text-slate-600 text-xs ml-2">
                    ({lawyer.reviewCount} {lawyer.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>

                {/* Consultation Fee */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">Consultation Fee</span>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    KES {lawyer.consultationFee.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">per session</p>
                </div>

                {/* Book Button - Only show for non-lawyer users */}
                {user?.role !== 'LAWYER' ? (
                  <button
                    onClick={handleBookConsultation}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm transition bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Request Consultation
                  </button>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 text-center">
                      As a fellow lawyer, you can view this profile but cannot book consultations.
                    </p>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Right Column - Details (Scrollable) */}
            <div className="lg:col-span-8 space-y-6">
              {/* About */}
              <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">About</h2>
              <p className="text-slate-700 leading-relaxed">{lawyer.bio}</p>
            </div>

            {/* Key Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Key Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Location</p>
                    <p className="text-sm text-slate-600">
                      {lawyer.locationDetails?.city || lawyer.location}
                      {lawyer.locationDetails?.county && `, ${lawyer.locationDetails.county}`}
                    </p>
                    {lawyer.locationDetails?.address && (
                      <p className="text-xs text-slate-500 mt-1">{lawyer.locationDetails.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Experience</p>
                    <p className="text-sm text-slate-600">{lawyer.yearsOfExperience} years</p>
                  </div>
                </div>

                {lawyer.yearOfAdmission && (
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Year of Admission</p>
                      <p className="text-sm text-slate-600">{lawyer.yearOfAdmission}</p>
                    </div>
                  </div>
                )}

                {lawyer.licenseNumber && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">License Number</p>
                      <p className="text-sm text-slate-600">{lawyer.licenseNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Practice Areas */}
            {lawyer.specializations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Practice Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {lawyer.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Contact & Links</h2>
              <div className="space-y-3">
                {lawyer.linkedInProfile && (
                  <a
                    href={lawyer.linkedInProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-slate-700 hover:text-blue-600 transition"
                  >
                    <Linkedin className="h-5 w-5" />
                    <span className="text-sm">LinkedIn Profile</span>
                  </a>
                )}
                
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Note:</span> Contact details will be shared after booking confirmation
                </p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Client Reviews</h2>
              {lawyer.reviewCount === 0 ? (
                <p className="text-slate-600 text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600 text-center py-8">
                    {lawyer.reviewCount} verified {lawyer.reviewCount === 1 ? 'review' : 'reviews'}
                  </p>
                  {/* Reviews will be implemented in future update */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PublicLawyerProfile;
