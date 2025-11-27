import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Award, 
  Linkedin,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Crown,
  Sparkles,
  Upload,
  X
} from 'lucide-react';
import axiosInstance from '../lib/axios';

interface OnboardingFormData {
  licenseNumber: string;
  yearOfAdmission: number;
  specializations: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    county: string;
  };
  bio: string;
  yearsOfExperience: number;
  profileImageUrl?: string;
  linkedInProfile?: string;
}

const SPECIALIZATION_CATEGORIES = [
  { id: 'CORPORATE', name: 'Corporate Law', description: 'Business, mergers, contracts', category: 'CORPORATE' },
  { id: 'CRIMINAL', name: 'Criminal Law', description: 'Defense, prosecution', category: 'CRIMINAL' },
  { id: 'FAMILY', name: 'Family Law', description: 'Divorce, custody, adoption', category: 'FAMILY' },
  { id: 'PROPERTY', name: 'Property Law', description: 'Real estate, land disputes', category: 'PROPERTY' },
  { id: 'IMMIGRATION', name: 'Immigration Law', description: 'Visas, permits, citizenship', category: 'IMMIGRATION' },
  { id: 'IP', name: 'Intellectual Property', description: 'Patents, trademarks, copyright', category: 'IP' },
  { id: 'EMPLOYMENT', name: 'Employment Law', description: 'Labor disputes, contracts', category: 'EMPLOYMENT' },
];

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Kakamega', 'Nyeri', 'Machakos', 'Meru', 'Embu',
  'Naivasha', 'Nanyuki', 'Kiambu', 'Murang\'a', 'Kajiado', 'Kilifi'
];

const FREE_TIER_LIMITS = {
  maxSpecializations: 2,
  maxBioLength: 200,
  features: [
    '✅ Basic profile listing',
    '✅ Up to 2 specializations',
    '✅ Accept consultation requests',
    '⚠️ Limited visibility in search',
    '❌ No priority placement',
    '❌ No advanced analytics',
    '❌ No unlimited specializations'
  ]
};

export const LawyerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormData>({
    licenseNumber: '',
    yearOfAdmission: new Date().getFullYear(),
    specializations: [],
    location: {
      latitude: -1.286389,
      longitude: 36.817223,
      address: '',
      city: '',
      county: 'Nairobi'
    },
    bio: '',
    yearsOfExperience: 0,
    profileImageUrl: '',
    linkedInProfile: ''
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData({ ...formData, profileImageUrl: '' });
  };

  const handleSpecializationToggle = (spec: { id: string; name: string; category: string }) => {
    const isSelected = formData.specializations.some(s => s.category === spec.id);
    
    if (isSelected) {
      setFormData({
        ...formData,
        specializations: formData.specializations.filter(s => s.category !== spec.id)
      });
    } else {
      // Free tier restriction: max 2 specializations
      if (formData.specializations.length >= FREE_TIER_LIMITS.maxSpecializations) {
        setShowUpgradePrompt(true);
        return;
      }
      
      setFormData({
        ...formData,
        specializations: [...formData.specializations, {
          id: spec.id,
          name: spec.name,
          category: spec.id
        }]
      });
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    
    // Free tier restriction: max 200 characters
    if (text.length > FREE_TIER_LIMITS.maxBioLength) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setFormData({ ...formData, bio: text });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.licenseNumber.length > 0 && formData.yearOfAdmission > 1960;
      case 2:
        return formData.specializations.length > 0;
      case 3:
        return formData.location.city.length > 0 && formData.location.address.length > 0;
      case 4:
        return formData.bio.length >= 50 && formData.yearsOfExperience >= 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else {
      setError('Please complete all required fields before proceeding');
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload photo first if one is selected
      if (photoFile) {
        setUploadingPhoto(true);
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        
        try {
          const uploadResponse = await axiosInstance.post('/users/upload-photo', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (uploadResponse.data.success && uploadResponse.data.data?.url) {
            formData.profileImageUrl = uploadResponse.data.data.url;
          }
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr);
          // Continue with onboarding even if photo upload fails
        } finally {
          setUploadingPhoto(false);
        }
      }

      const response = await axiosInstance.post('/users/lawyer-onboarding', formData);

      if (response.data.success) {
        // Show success message with upgrade prompt
        setCurrentStep(5); // Success step
      } else {
        setError(response.data.message || 'Failed to complete onboarding');
      }
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step ? <CheckCircle className="h-6 w-6" /> : step}
            </div>
            {step < 4 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span>Credentials</span>
        <span>Specializations</span>
        <span>Location</span>
        <span>Profile</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Award className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Professional Credentials</h2>
        <p className="text-gray-600 mt-2">Let's verify your legal credentials</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          License Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.licenseNumber}
          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
          placeholder="e.g., LSK/12345/2020"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Your Law Society of Kenya registration number</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year of Admission <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.yearOfAdmission}
          onChange={(e) => setFormData({ ...formData, yearOfAdmission: parseInt(e.target.value) })}
          min="1960"
          max={new Date().getFullYear()}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Year you were admitted to the bar</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.yearsOfExperience}
          onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) })}
          min="0"
          max="60"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Areas of Practice</h2>
        <p className="text-gray-600 mt-2">Select your specializations</p>
        
        {/* Free Tier Badge */}
        <div className="mt-4 inline-flex items-center px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Crown className="h-5 w-5 text-amber-600 mr-2" />
          <span className="text-sm font-medium text-amber-800">
            Free Tier: {formData.specializations.length}/{FREE_TIER_LIMITS.maxSpecializations} Specializations
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SPECIALIZATION_CATEGORIES.map((spec) => {
          const isSelected = formData.specializations.some(s => s.category === spec.id);
          const isDisabled = !isSelected && formData.specializations.length >= FREE_TIER_LIMITS.maxSpecializations;
          
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => handleSpecializationToggle(spec)}
              disabled={isDisabled}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{spec.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{spec.description}</p>
                </div>
                {isSelected && <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />}
              </div>
            </button>
          );
        })}
      </div>

      {formData.specializations.length === 0 && (
        <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
          <p className="text-sm text-yellow-800">Please select at least one specialization</p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Practice Location</h2>
        <p className="text-gray-600 mt-2">Where do you practice?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          County <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.location.county}
          onChange={(e) => setFormData({
            ...formData,
            location: { ...formData.location, county: e.target.value }
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {KENYAN_COUNTIES.map((county) => (
            <option key={county} value={county}>{county}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City/Town <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.location.city}
          onChange={(e) => setFormData({
            ...formData,
            location: { ...formData.location, city: e.target.value }
          })}
          placeholder="e.g., Nairobi"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Office Address <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.location.address}
          onChange={(e) => setFormData({
            ...formData,
            location: { ...formData.location, address: e.target.value }
          })}
          placeholder="e.g., 3rd Floor, ABC Towers, Kimathi Street"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Professional Profile</h2>
        <p className="text-gray-600 mt-2">Tell clients about yourself</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Bio <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.bio}
          onChange={handleBioChange}
          placeholder="Describe your legal expertise, experience, and approach to client service..."
          rows={6}
          maxLength={FREE_TIER_LIMITS.maxBioLength}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">Minimum 50 characters</p>
          <p className={`text-xs ${
            formData.bio.length >= FREE_TIER_LIMITS.maxBioLength
              ? 'text-amber-600 font-semibold'
              : 'text-gray-500'
          }`}>
            {formData.bio.length}/{FREE_TIER_LIMITS.maxBioLength} characters
          </p>
        </div>
        {formData.bio.length >= FREE_TIER_LIMITS.maxBioLength && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
            <Crown className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Free tier limit reached</p>
              <p>Upgrade to Premium for unlimited bio length and enhanced visibility</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          LinkedIn Profile <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Linkedin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={formData.linkedInProfile}
            onChange={(e) => {
              let value = e.target.value.trim();
              // Auto-format: if user enters just username, convert to full URL
              if (value && !value.startsWith('http')) {
                // Remove any existing linkedin.com/in/ prefix if user pasted it
                value = value.replace(/^(www\.)?linkedin\.com\/in\//, '');
                value = `https://www.linkedin.com/in/${value}`;
              }
              setFormData({ ...formData, linkedInProfile: value });
            }}
            placeholder="Enter username (e.g., john-doe) or full URL"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Just type your LinkedIn username - we'll create the full URL automatically
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        
        {photoPreview ? (
          <div className="relative inline-block">
            <img 
              src={photoPreview} 
              alt="Profile preview" 
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
              <Upload className="h-5 w-5" />
              <span>Choose Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500">Max 5MB • JPG, PNG, GIF</p>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">Add your professional photo to boost credibility</p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Profile Submitted Successfully! 📋</h2>
        <p className="text-lg text-gray-600 mb-2">Thank you for joining Wakili Pro</p>
        <div className="max-w-md mx-auto mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>⏳ Pending Verification</strong><br/>
            Your credentials are under review by our admin team. You'll receive an email notification once your profile is approved (usually within 24-48 hours).
          </p>
        </div>
      </div>

      {/* Free Tier Summary */}
      <div className="max-w-md mx-auto mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-center mb-4">
          <Crown className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Free Tier Active</h3>
        </div>
        <div className="space-y-2 text-sm text-left">
          {FREE_TIER_LIMITS.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <span className="mr-2">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Prompt */}
      <div className="max-w-md mx-auto mb-6 p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white">
        <Sparkles className="h-8 w-8 mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Unlock Your Full Potential</h3>
        <p className="mb-4">Upgrade to Premium and get:</p>
        <ul className="text-left space-y-2 mb-6">
          <li>✨ Unlimited specializations</li>
          <li>✨ Priority search placement</li>
          <li>✨ Advanced analytics dashboard</li>
          <li>✨ Unlimited bio length</li>
          <li>✨ Featured lawyer badge</li>
          <li>✨ Direct client messaging</li>
        </ul>
        <button
          onClick={() => navigate('/subscription')}
          className="w-full bg-white text-orange-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all shadow-lg"
        >
          Upgrade to Premium - KES 4,999/month
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => navigate('/lawyer/dashboard')}
          className="w-full max-w-md mx-auto block bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/lawyer/profile')}
          className="w-full max-w-md mx-auto block bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all"
        >
          View My Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep < 5 && renderProgressBar()}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {currentStep < 5 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-all"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <AlertCircle className="h-6 w-6" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Upgrade to Premium</h3>
              <p className="text-gray-600 mb-6">
                You've reached the free tier limit. Upgrade to unlock unlimited features and get more clients!
              </p>

              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <p className="font-semibold text-blue-900 mb-2">Premium Benefits:</p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>✨ Unlimited specializations</li>
                  <li>✨ Extended bio (up to 2000 characters)</li>
                  <li>✨ Priority search ranking</li>
                  <li>✨ Featured lawyer badge</li>
                  <li>✨ Advanced analytics</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowUpgradePrompt(false);
                    navigate('/subscription');
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Upgrade Now - KES 2,999/month
                </button>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Continue with Free
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerOnboarding;
