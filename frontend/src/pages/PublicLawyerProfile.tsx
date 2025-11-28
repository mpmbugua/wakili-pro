import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
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
      <GlobalLayout>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading lawyer profile...</p>
          </div>
        </div>
      </GlobalLayout>
    );
  }

  if (error || !lawyer) {
    return (
      <GlobalLayout>
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
      </GlobalLayout>
    );
  }

  const imageUrl = lawyer.profileImageUrl || 
    `https://ui-avatars.com/api/?name=${lawyer.firstName}+${lawyer.lastName}&background=3b82f6&color=fff&size=400`;

  return (
    <GlobalLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/lawyers')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Lawyers
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-20">
              {/* Profile Image */}
              <div className="relative aspect-square">
                <img
                  src={imageUrl}
                  alt={lawyer.name}
                  className="w-full h-full object-cover"
                />
                {lawyer.isVerified && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1.5 rounded-full flex items-center space-x-1.5 text-xs font-semibold shadow-lg">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </div>
                )}
                <div className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${
                  lawyer.isAvailable ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {lawyer.isAvailable ? '● Available Now' : '● Busy'}
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{lawyer.name}</h1>
                <p className="text-blue-600 font-semibold mb-4 text-sm">{lawyer.specialty}</p>

                {/* Rating */}
                <div className="flex items-center justify-center bg-slate-50 rounded-lg p-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <Star className="h-6 w-6 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-slate-900">{lawyer.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-600 text-sm ml-2">
                    ({lawyer.reviewCount} {lawyer.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>

                {/* Consultation Fee */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Consultation Fee</span>
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    KES {lawyer.consultationFee.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">per session (60 minutes)</p>
                </div>

                {/* Book Button */}
                <button
                  onClick={handleBookConsultation}
                  disabled={!lawyer.isAvailable}
                  className={`w-full py-3.5 rounded-lg font-semibold transition-all shadow-md ${
                    lawyer.isAvailable
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {lawyer.isAvailable ? 'Book Consultation Now' : 'Currently Unavailable'}
                </button>
                
                {/* Quick Info */}
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                  <div className="flex items-center text-sm text-slate-600">
                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                    <span>Typically responds in 2-4 hours</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Background verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                About
              </h2>
              <p className="text-slate-700 leading-relaxed">{lawyer.bio}</p>
            </div>

            {/* Key Information */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                Key Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm font-medium text-slate-900">
                      {lawyer.locationDetails?.city || lawyer.location}
                      {lawyer.locationDetails?.county && `, ${lawyer.locationDetails.county}`}
                    </p>
                    {lawyer.locationDetails?.address && (
                      <p className="text-xs text-slate-600 mt-1">{lawyer.locationDetails.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Experience</p>
                    <p className="text-sm font-medium text-slate-900">{lawyer.yearsOfExperience} years of practice</p>
                  </div>
                </div>

                {lawyer.yearOfAdmission && (
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                    <Award className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Year of Admission</p>
                      <p className="text-sm font-medium text-slate-900">{lawyer.yearOfAdmission}</p>
                    </div>
                  </div>
                )}

                {lawyer.licenseNumber && (
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">License Number</p>
                      <p className="text-sm font-medium text-slate-900">{lawyer.licenseNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Practice Areas */}
            {lawyer.specializations.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Practice Areas
                </h2>
                <div className="flex flex-wrap gap-3">
                  {lawyer.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold hover:shadow-md transition"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Links */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Contact & Links
              </h2>
              <div className="space-y-4">
                {lawyer.linkedInProfile && (
                  <a
                    href={lawyer.linkedInProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition group"
                  >
                    <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">View LinkedIn Profile</span>
                  </a>
                )}
                
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Privacy Protected:</span> Contact details will be shared after booking confirmation
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
                Client Reviews
              </h2>
              {lawyer.reviewCount === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No reviews yet</p>
                  <p className="text-sm text-slate-500 mt-1">Be the first to review this lawyer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Star className="h-8 w-8 text-yellow-400 fill-current" />
                      <span className="text-3xl font-bold text-slate-900">{lawyer.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-slate-600">
                      Based on {lawyer.reviewCount} verified {lawyer.reviewCount === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                  {/* Individual reviews will be implemented in future update */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
};

export default PublicLawyerProfile;
