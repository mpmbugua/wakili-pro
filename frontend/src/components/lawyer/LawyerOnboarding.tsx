import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Scale, MapPin, FileText, Briefcase, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { lawyerService } from '../../services/lawyerService';
import { z } from 'zod';

// Inline schema to replace shared dependency
const LawyerOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  specializations: z.array(z.string()).min(1, 'Select at least one specialization'),
  experience: z.number().min(0, 'Experience must be 0 or greater'),
  location: z.string().min(1, 'Location is required'),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  hourlyRate: z.number().min(1, 'Hourly rate is required')
});

type LawyerOnboardingFormData = z.infer<typeof LawyerOnboardingSchema>;

const LEGAL_SPECIALIZATIONS: Array<{
  id: string;
  name: string;
  category: 'CORPORATE' | 'CRIMINAL' | 'FAMILY' | 'PROPERTY' | 'IMMIGRATION' | 'IP' | 'EMPLOYMENT';
}> = [
  { id: 'corporate', name: 'Corporate Law', category: 'CORPORATE' },
  { id: 'criminal', name: 'Criminal Law', category: 'CRIMINAL' },
  { id: 'family', name: 'Family Law', category: 'FAMILY' },
  { id: 'property', name: 'Property Law', category: 'PROPERTY' },
  { id: 'employment', name: 'Employment Law', category: 'EMPLOYMENT' },
  { id: 'immigration', name: 'Immigration Law', category: 'IMMIGRATION' },
  { id: 'ip', name: 'Intellectual Property', category: 'IP' },
  { id: 'constitutional', name: 'Constitutional Law', category: 'CORPORATE' },
  { id: 'tax', name: 'Tax Law', category: 'CORPORATE' },
  { id: 'banking', name: 'Banking & Finance', category: 'CORPORATE' },
  { id: 'real-estate', name: 'Real Estate', category: 'PROPERTY' },
  { id: 'personal-injury', name: 'Personal Injury', category: 'FAMILY' }
];

const LawyerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSpecializations, setSelectedSpecializations] = useState<typeof LEGAL_SPECIALIZATIONS>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LawyerOnboardingFormData>({
    resolver: zodResolver(LawyerOnboardingSchema),
    defaultValues: {
      specializations: [],
      location: {
        latitude: -1.2921, // Nairobi coordinates
        longitude: 36.8219,
        address: '',
        city: 'Nairobi',
        county: 'Nairobi'
      }
    }
  });

  const handleSpecializationToggle = (specialization: typeof LEGAL_SPECIALIZATIONS[0]) => {
    const isSelected = selectedSpecializations.find(s => s.id === specialization.id);
    
    if (isSelected) {
      const newSelections = selectedSpecializations.filter(s => s.id !== specialization.id);
      setSelectedSpecializations(newSelections);
      setValue('specializations', newSelections);
    } else {
      const newSelections = [...selectedSpecializations, specialization];
      setSelectedSpecializations(newSelections);
      setValue('specializations', newSelections);
    }
  };

  const onSubmit = async (data: LawyerOnboardingFormData) => {
    try {
      setIsSubmitting(true);

      const response = await lawyerService.completeLawyerOnboarding(data);

      if (response.success) {
        navigate('/dashboard?onboarded=true');
      } else {
        console.error('Onboarding failed:', response.message);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'LAWYER') {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            Complete Your Legal Practice Profile
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Help clients find and connect with your legal expertise
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Professional Credentials */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Briefcase className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Professional Credentials</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Bar Admission/License Number *
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  {...register('licenseNumber')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., LSK/001/2020"
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="yearOfAdmission" className="block text-sm font-medium text-gray-700 mb-2">
                  Year of Admission to the Bar *
                </label>
                <input
                  type="number"
                  id="yearOfAdmission"
                  {...register('yearOfAdmission', { valueAsNumber: true })}
                  min="1960"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 2018"
                />
                {errors.yearOfAdmission && (
                  <p className="mt-1 text-sm text-red-600">{errors.yearOfAdmission.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Legal Experience *
                </label>
                <input
                  type="number"
                  id="yearsOfExperience"
                  {...register('yearsOfExperience', { valueAsNumber: true })}
                  min="0"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 5"
                />
                {errors.yearsOfExperience && (
                  <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="profileImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Photo URL (Optional)
                </label>
                <input
                  type="url"
                  id="profileImageUrl"
                  {...register('profileImageUrl')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/photo.jpg"
                />
                {errors.profileImageUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.profileImageUrl.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Legal Specializations */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Scale className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Legal Specializations *</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select the areas of law you practice (minimum 1 required):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LEGAL_SPECIALIZATIONS.map((specialization) => {
                const isSelected = selectedSpecializations.find(s => s.id === specialization.id);
                return (
                  <button
                    key={specialization.id}
                    type="button"
                    onClick={() => handleSpecializationToggle(specialization)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{specialization.name}</span>
                    {isSelected ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </div>

            {errors.specializations && (
              <p className="mt-2 text-sm text-red-600">{errors.specializations.message}</p>
            )}
          </div>

          {/* Location Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Practice Location *</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Office Address *
                </label>
                <input
                  type="text"
                  id="address"
                  {...register('location.address')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 123 Kimathi Street, CBD"
                />
                {errors.location?.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  {...register('location.city')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Nairobi"
                />
                {errors.location?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                  County *
                </label>
                <select
                  id="county"
                  {...register('location.county')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select County</option>
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kiambu">Kiambu</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Machakos">Machakos</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Uasin Gishu">Uasin Gishu</option>
                  <option value="Kakamega">Kakamega</option>
                  <option value="Kilifi">Kilifi</option>
                  <option value="Meru">Meru</option>
                </select>
                {errors.location?.county && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.county.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Bio */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Professional Biography *</h2>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Tell clients about your experience and approach to law
              </label>
              <textarea
                id="bio"
                {...register('bio')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your legal background, notable cases, approach to client service, and what makes your practice unique. This will be visible to potential clients searching for legal services."
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Minimum 100 characters. This helps clients understand your expertise and approach.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save for Later
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isSubmitting
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Complete Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LawyerOnboarding;