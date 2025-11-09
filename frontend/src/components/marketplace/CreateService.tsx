import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, Clock, FileText, Plus, X } from 'lucide-react';
import { CreateServiceSchema } from '../../../../shared/src/schemas/marketplace';
import { useAuthStore } from '../../store/authStore';
import { marketplaceService } from '../../services/marketplaceService';
import { z } from 'zod';

type CreateServiceFormData = z.infer<typeof CreateServiceSchema>;

const SERVICE_TYPES = [
  { 
    value: 'CONSULTATION', 
    label: 'Legal Consultation',
    description: 'One-on-one meetings to discuss legal matters',
    icon: '💬'
  },
  { 
    value: 'DOCUMENT_DRAFTING', 
    label: 'Document Drafting',
    description: 'Creation of legal documents, contracts, and agreements',
    icon: '📄'
  },
  { 
    value: 'LEGAL_REVIEW', 
    label: 'Legal Review',
    description: 'Review and analysis of existing legal documents',
    icon: '🔍'
  },
  { 
    value: 'IP_FILING', 
    label: 'IP Filing',
    description: 'Trademark, patent, and intellectual property registration',
    icon: '©️'
  },
  { 
    value: 'DISPUTE_MEDIATION', 
    label: 'Dispute Mediation',
    description: 'Alternative dispute resolution services',
    icon: '⚖️'
  },
  { 
    value: 'CONTRACT_NEGOTIATION', 
    label: 'Contract Negotiation',
    description: 'Negotiating terms and conditions on behalf of clients',
    icon: '🤝'
  }
];

const CreateService: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateServiceFormData>({
    resolver: zodResolver(CreateServiceSchema)
  });

  const selectedType = watch('type');

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim()) && selectedTags.length < 10) {
      const updatedTags = [...selectedTags, newTag.trim()];
      setSelectedTags(updatedTags);
      setValue('tags', updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(updatedTags);
    setValue('tags', updatedTags);
  };

  const onSubmit = async (data: CreateServiceFormData) => {
    try {
      setIsSubmitting(true);

      const response = await marketplaceService.createService(data);

      if (response.success) {
        navigate('/lawyer/services?created=true');
      } else {
        console.error('Service creation failed:', response.message);
      }
    } catch (error) {
      console.error('Service creation error:', error);
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
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            Create New Service Offering
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Add a service to your marketplace profile for clients to book
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Service Type */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Briefcase className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Service Type *</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICE_TYPES.map((serviceType) => (
                <label
                  key={serviceType.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    selectedType === serviceType.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={serviceType.value}
                    {...register('type')}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{serviceType.icon}</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {serviceType.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {serviceType.description}
                      </div>
                    </div>
                  </div>
                  {selectedType === serviceType.value && (
                    <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-indigo-600"></div>
                  )}
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Service Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Service Details *</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Title *
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Corporate Contract Review & Advisory"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Description *
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Provide a detailed description of your service, what it includes, your approach, and what clients can expect..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Pricing & Duration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="priceKES" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (KES) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    id="priceKES"
                    {...register('priceKES', { valueAsNumber: true })}
                    min="100"
                    max="1000000"
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="5000"
                  />
                </div>
                {errors.priceKES && (
                  <p className="mt-1 text-sm text-red-600">{errors.priceKES.message}</p>
                )}
              </div>

              {selectedType === 'CONSULTATION' && (
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="duration"
                      {...register('duration', { valueAsNumber: true })}
                      min="15"
                      max="480"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="60"
                    />
                  </div>
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                  )}
                </div>
              )}

              {selectedType !== 'CONSULTATION' && (
                <div>
                  <label htmlFor="deliveryTimeframe" className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Timeframe
                  </label>
                  <input
                    type="text"
                    id="deliveryTimeframe"
                    {...register('deliveryTimeframe')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 3-5 business days"
                  />
                  {errors.deliveryTimeframe && (
                    <p className="mt-1 text-sm text-red-600">{errors.deliveryTimeframe.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Plus className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Service Tags (Optional)</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add tags to help clients find your service..."
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || selectedTags.length >= 10}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500">
                Tags help clients discover your service. You can add up to 10 tags.
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
              Cancel
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
                  Creating...
                </div>
              ) : (
                'Create Service'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateService;